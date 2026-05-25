import { AuditBadge } from "../ui/primitives";
import { categoryBadgeClass, formatCategoryLabel } from "../../utils/formatAuditLog";

export function CategoryBadge({ category }: { category: string }) {
  return (
    <AuditBadge className={categoryBadgeClass(category)}>
      {formatCategoryLabel(category)}
    </AuditBadge>
  );
}
