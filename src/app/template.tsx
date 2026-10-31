export default function Template({ children }: { children: React.ReactNode }) {
  // No opacity/blur entrance animation here: starting content at opacity 0
  // delays the Largest Contentful Paint on every navigation.
  return <div className="w-full min-h-screen">{children}</div>;
}
