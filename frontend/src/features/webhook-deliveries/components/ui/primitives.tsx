import clsx from "clsx";
import type { ReactNode } from "react";

export function WebhookSkeleton({ className }: { className?: string }) {
  return <div className={clsx("webhook-skeleton", className)} aria-hidden />;
}

export function WebhookEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-lg font-semibold text-app-text">{title}</p>
      {description && (
        <p className="text-sm text-app-muted mt-2 max-w-md">{description}</p>
      )}
    </div>
  );
}

export function WebhookErrorState({
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
        <button type="button" className="reg-toolbar-btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function WebhookBadge({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <span className={clsx("webhook-badge", className)}>{children}</span>;
}
