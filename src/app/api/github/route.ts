/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element, react-hooks/exhaustive-deps */
import { NextResponse } from "next/server";

const GITHUB_LOGIN = "Hafikan";

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    let public_repos = 0;
    let html_url = `https://github.com/${GITHUB_LOGIN}`;
    let createdYear: number | null = null;

    if (token) {
      // Authenticated: /user returns the token owner incl. private repo counts + created_at.
      const userRes = await fetch("https://api.github.com/user", {
        headers: authHeaders,
        next: { revalidate: 3600 }, // Cache for 1 hour
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        // Repo count = public + private.
        public_repos = (userData.public_repos || 0) + (userData.total_private_repos || 0);
        html_url = userData.html_url || html_url;
        if (userData.created_at) createdYear = new Date(userData.created_at).getFullYear();
      }
    } else {
      // Unauthenticated fallback: public repos only.
      const userRes = await fetch(`https://api.github.com/users/${GITHUB_LOGIN}`, {
        next: { revalidate: 3600 },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        public_repos = userData.public_repos || 0;
        html_url = userData.html_url || html_url;
      }
    }

    let totalCommits = 0;

    if (token && createdYear) {
      // Sum commit contributions (private included) year by year via GraphQL.
      // contributionsCollection is capped at a 1-year window, so we query per calendar year.
      const currentYear = new Date().getFullYear();
      const query = `query($from: DateTime!, $to: DateTime!) {
        viewer {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
          }
        }
      }`;

      const years: number[] = [];
      for (let y = createdYear; y <= currentYear; y++) years.push(y);

      const perYear = await Promise.all(
        years.map(async (year) => {
          const from = `${year}-01-01T00:00:00Z`;
          const to = year === currentYear ? new Date().toISOString() : `${year}-12-31T23:59:59Z`;
          const res = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: { ...authHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables: { from, to } }),
            next: { revalidate: 1800 }, // Cache for 30 minutes
          });
          if (!res.ok) return 0;
          const json = await res.json();
          return json?.data?.viewer?.contributionsCollection?.totalCommitContributions || 0;
        })
      );

      totalCommits = perYear.reduce((sum, n) => sum + n, 0);
    } else {
      // No token: public commit count via the Search API.
      const commitsRes = await fetch(`https://api.github.com/search/commits?q=author:${GITHUB_LOGIN}`, {
        headers: {
          Accept: "application/vnd.github.cloak-preview",
          ...authHeaders,
        },
        next: { revalidate: 1800 },
      });
      if (commitsRes.ok) {
        const searchData = await commitsRes.json();
        totalCommits = searchData.total_count || 0;
      }
    }

    return NextResponse.json({
      total_commits: totalCommits,
      public_repos,
      html_url,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
