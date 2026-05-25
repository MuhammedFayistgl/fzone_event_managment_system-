import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost";
  children: ReactNode;
};

export function ReconButton({
  variant = "default",
  className,
  children,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={clsx(
        variant === "primary" && "reg-toolbar-btn reg-toolbar-btn--primary",
        variant === "default" && "reg-toolbar-btn",
        variant === "ghost" &&
          "reg-toolbar-btn border-transparent bg-transparent hover:bg-[var(--color-card-hover)]",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ReconBadge({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={clsx("finance-recon-badge", className)}>{children}</span>
  );
}

export function ReconSkeleton({ className }: { className?: string }) {
  return <div className={clsx("finance-recon-skeleton", className)} aria-hidden />;
}

export function ReconEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-lg font-semibold text-app-text">{title}</p>
      {description && (
        <p className="text-sm text-app-muted mt-2 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ReconErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center justify-between gap-4"
      role="alert"
    >
      <p className="text-sm text-red-600 dark:text-red-300">{message}</p>
      {onRetry && (
        <ReconButton variant="ghost" onClick={onRetry}>
          Retry
        </ReconButton>
      )}
    </div>
  );
}

export function ReconInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx("finance-recon-input app-input", props.className)} {...props} />;
}
