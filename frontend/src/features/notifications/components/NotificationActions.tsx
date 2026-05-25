import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import clsx from "clsx";
import type { NotificationAction } from "../types/notification.types";
import { useExecuteActionMutation } from "../hooks/useNotificationQueries";

type Props = {
  notificationId: string;
  actions: NotificationAction[];
  onDone?: () => void;
};

export function NotificationActions({ notificationId, actions, onDone }: Props) {
  const navigate = useNavigate();
  const execute = useExecuteActionMutation();

  if (!actions.length) return null;

  const handleAction = async (action: NotificationAction) => {
    try {
      const result = await execute.mutateAsync({
        id: notificationId,
        actionId: action.id,
      });
      if (result.kind === "link" && result.url) {
        navigate(result.url);
      } else {
        toast.success(result.message || "Action completed");
      }
      onDone?.();
    } catch {
      toast.error("Could not run action");
    }
  };

  return (
    <div className="notif-item__actions">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className={clsx(
            "notif-item__btn",
            action.variant === "primary" && "notif-item__btn--primary",
            action.variant === "danger" && "notif-item__btn--danger"
          )}
          disabled={execute.isPending}
          onClick={() => handleAction(action)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
