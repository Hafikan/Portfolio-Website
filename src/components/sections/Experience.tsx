"use client";

import { useEffect, useState } from "react";
import { Briefcase, MapPin } from "lucide-react";
import FadeIn from "../ui/FadeIn";
import Section from "../ui/Section";
import HoverSpotlight from "../ui/HoverSpotlight";
import { cn } from "@/lib/utils";
import { formatPeriod, type Experience as ExperienceEntry } from "@/lib/experience";

export default function Experience() {
  const [entries, setEntries] = useState<ExperienceEntry[]>([]);

  useEffect(() => {
    fetch("/api/experience")
      .then(res => res.json())
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch experience", err));
  }, []);

  // Nothing to show yet — don't render an empty section.
  if (entries.length === 0) return null;

  return (
    <Section id="experience" className="py-32 relative">
      <FadeIn className="mb-16 text-center lg:text-left relative z-10 px-6 max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
          Work <span className="text-zinc-500">Experience</span>
        </h2>
      </FadeIn>

      <div className="max-w-5xl mx-auto px-6 lg:px-0 relative z-10">
        <div className="relative">
          {/* Timeline rail */}
          <div
            aria-hidden
            className="absolute left-[7px] top-8 bottom-8 w-px bg-gradient-to-b from-emerald-500/50 via-white/10 to-white/5"
          />

          <ol className="space-y-8">
            {entries.map((entry, idx) => (
              <li key={entry.id} className="relative pl-10">
                {/* Timeline node */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-8 w-[15px] h-[15px] rounded-full border-2",
                    entry.current
                      ? "border-emerald-400 bg-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                      : "border-zinc-600 bg-zinc-900"
                  )}
                >
                  {entry.current && (
                    <span className="absolute inset-0 rounded-full bg-emerald-400/50 animate-ping" />
                  )}
                </span>

                <FadeIn delay={Math.min(idx * 0.08, 0.4)}>
                  <HoverSpotlight
                    className="rounded-2xl glass-effect hover:border-zinc-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300"
                    innerClassName="p-6 md:p-8 w-full h-full"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
                          {entry.role}
                        </h3>
                        <p className="mt-1 flex items-center gap-2 font-medium text-emerald-400">
                          <Briefcase className="w-4 h-4 shrink-0" />
                          {entry.company}
                        </p>
                      </div>
                      <div className="md:text-right shrink-0">
                        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                          {formatPeriod(entry)}
                        </p>
                        {entry.location && (
                          <p className="mt-1.5 flex items-center md:justify-end gap-1.5 text-sm text-zinc-500">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {entry.location}
                          </p>
                        )}
                      </div>
                    </div>

                    {entry.highlights && entry.highlights.length > 0 && (
                      <ul className="space-y-2 text-zinc-300 leading-relaxed">
                        {entry.highlights.map((highlight, i) => (
                          <li key={i} className="flex gap-3">
                            <span aria-hidden className="mt-[0.7em] w-1 h-1 rounded-full bg-zinc-500 shrink-0" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {entry.tech && entry.tech.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {entry.tech.map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-zinc-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </HoverSpotlight>
                </FadeIn>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
