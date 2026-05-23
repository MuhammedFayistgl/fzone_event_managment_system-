import type { ReactNode } from "react";
import Header from "../Header/Header";
import { useAppSelector } from "../hooks/hooks";

type Props = {
  children: ReactNode;
  showHeader?: boolean;
  showGlow?: boolean;
};

/** Wraps admin pages that share Header + dark/light shell */
export default function AdminShell({
  children,
  showHeader = true,
  showGlow,
}: Props) {
  const isDark = useAppSelector((s) => s.theme.mode) === "dark";
  const glow = showGlow ?? isDark;

  return (
    <div className="min-h-screen bg-app-base text-app-text relative">
      {glow && <div className="app-mesh-bg" aria-hidden />}
      <div className="relative z-10 flex flex-col min-h-screen">
        {showHeader && <Header />}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
