import type { CSSProperties, ReactNode } from "react";
import { useAppSelector } from "../hooks/hooks";

type Props = {
  title?: string;
  subtitle?: string;
  /** Small badge above the title */
  eyebrow?: string;
  children: ReactNode;
  showGlow?: boolean;
  /** inside AdminShell — skip outer page wrapper */
  embedded?: boolean;
  className?: string;
  contentClassName?: string;
  /** Right-side header slot (buttons, stats, etc.) */
  actions?: ReactNode;
  maxWidth?: "default" | "wide" | "full";
};

const maxWidthClass = {
  default: "app-page-layout__inner--default",
  wide: "app-page-layout__inner--wide",
  full: "app-page-layout__inner--full",
} as const;

export default function AppPageLayout({
  title,
  subtitle,
  eyebrow,
  children,
  showGlow = true,
  embedded = false,
  className = "",
  contentClassName = "",
  actions,
  maxWidth = "default",
}: Props) {
  const isDark = useAppSelector((s) => s.theme.mode) === "dark";

  const hasHeader = Boolean(title || subtitle || eyebrow || actions);

  const header = hasHeader && (
    <header
      className="app-page-header pro-animate-in"
      style={{ ["--pro-delay" as string]: "0ms" } as CSSProperties}
    >
      {eyebrow && (
        <p className="app-page-eyebrow pro-eyebrow-pulse">{eyebrow}</p>
      )}
      <div className="app-page-header__row">
        <div className="app-page-header__text min-w-0">
          {title && <h1 className="app-page-title">{title}</h1>}
          {subtitle && <p className="app-page-subtitle">{subtitle}</p>}
        </div>
        {actions && (
          <div className="app-page-header__actions shrink-0">{actions}</div>
        )}
      </div>
    </header>
  );

  const inner = (
    <div
      className={[
        "app-page-layout__inner",
        maxWidthClass[maxWidth],
        embedded ? "app-page-layout__inner--embedded" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {header}
      <div
        className={[
          "app-page-layout__content pro-animate-in",
          hasHeader ? "app-page-layout__content--with-header" : "",
          contentClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ ["--pro-delay" as string]: hasHeader ? "100ms" : "0ms" } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div
        className={[
          "app-page-layout",
          "app-page-layout--embedded",
          isDark ? "app-page-layout--dark" : "app-page-layout--light",
        ].join(" ")}
      >
        {showGlow && isDark && (
          <div className="app-page-layout__glow app-mesh-bg" aria-hidden />
        )}
        {inner}
      </div>
    );
  }

  return (
    <div
      className={[
        "app-page",
        "app-page-layout",
        isDark ? "app-page-layout--dark" : "app-page-layout--light",
      ].join(" ")}
    >
      {showGlow && (
        <div className="app-page-layout__glow app-mesh-bg app-mesh-bg--animated" aria-hidden />
      )}
      {inner}
    </div>
  );
}
