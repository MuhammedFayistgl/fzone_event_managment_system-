import clsx from "clsx";

const priorityClass: Record<string, string> = {
  critical: "notif-priority--critical",
  urgent: "notif-priority--urgent",
  high: "notif-priority--high",
  medium: "notif-priority--medium",
  low: "notif-priority--low",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={clsx("notif-priority-badge", priorityClass[priority] || priorityClass.medium)}>
      {priority}
    </span>
  );
}
