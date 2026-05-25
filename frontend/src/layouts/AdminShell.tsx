import type { ReactNode } from "react";
import Header from "../Header/Header";
import AdminSidebar from "./AdminSidebar";
import { useAppSelector } from "../hooks/hooks";

type Props = {
  children: ReactNode;
  showHeader?: boolean;
  showGlow?: boolean;
};

/** Wraps admin pages: sidebar (desktop) + header + main */
export default function AdminShell({
  children,
  showHeader = true,
  showGlow,
}: Props) {
  const isDark = useAppSelector((s) => s.theme.mode) === "dark";
  const glow = showGlow ?? isDark;

  return (
    <div className="min-h-screen bg-app-base text-app-text relative admin-shell">
      {glow && <div className="app-mesh-bg" aria-hidden />}
      <div className="relative z-10 flex min-h-screen">
        <AdminSidebar />
        <div className="admin-shell__main flex flex-1 flex-col min-w-0">
          {showHeader && <Header />}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
