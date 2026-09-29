import Link from "next/link";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/conversations", label: "Conversations" },
  { href: "/graph", label: "Graph" },
  { href: "/sidequests", label: "SideQuests" },
  { href: "/agents", label: "Agents" },
  { href: "/plaud", label: "Plaud Device" },
] as const;

interface AppNavProps {
  active: (typeof LINKS)[number]["href"];
}

export function AppNav({ active }: AppNavProps) {
  return (
    <nav className="flex w-full flex-wrap gap-1 rounded-lg bg-muted p-1">
      {LINKS.map((link) => {
        const isActive = active === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive
                ? "rounded-md bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm"
                : "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
