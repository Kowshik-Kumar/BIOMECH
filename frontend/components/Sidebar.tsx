import Link from "next/link";
import { Activity, FolderKanban, Gauge, HeartPulse, Settings } from "lucide-react";

type SidebarProps = {
  activeKey: "dashboard" | "sports" | "rehab" | "sessions" | "settings";
};

type MenuItem = {
  key: SidebarProps["activeKey"];
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const MENU_ITEMS: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/", icon: Gauge },
  { key: "sports", label: "Sports Training", href: "/sports/live", icon: Activity },
  { key: "rehab", label: "Injury Rehabilitation", href: "/rehabilitation", icon: HeartPulse },
  { key: "sessions", label: "Sessions", href: "/sports/sessions", icon: FolderKanban },
  { key: "settings", label: "Settings", href: "#", icon: Settings },
];

export default function Sidebar({ activeKey }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-slate-800 bg-slate-950/95 px-4 py-5">
      <div className="mb-7 border-b border-slate-800 pb-4">
        <p className="font-[var(--font-sora)] text-sm font-bold uppercase tracking-[0.16em] text-amber-300">Biomech AI</p>
        <p className="mt-1 text-xs text-slate-400">Posture Analytics Suite</p>
      </div>

      <nav className="space-y-1.5">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition duration-200",
                isActive
                  ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
                  : "border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900 hover:text-slate-100",
              ].join(" ")}
            >
              <Icon size={16} className={isActive ? "text-amber-300" : "text-slate-400"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
