import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  children: ReactNode;
  title?: string;
};

export default function PublicShell({ children, title = "FZone Registration" }: Props) {
  return (
    <div className="min-h-screen bg-app-base text-app-text">
      <header className="border-b border-app-border bg-app-surface/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-app-muted">FZone Events</p>
            <h1 className="text-lg font-bold text-app-text">{title}</h1>
          </div>
          <Link to="/login" className="text-sm text-app-accent hover:opacity-80">
            Staff login
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
