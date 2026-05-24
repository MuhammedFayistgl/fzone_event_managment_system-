export type ParticipantGender = "Male" | "Female" | "Other";

export const GENDER_OPTIONS: ParticipantGender[] = ["Male", "Female", "Other"];

const GENDER_STYLES: Record<
  ParticipantGender,
  { className: string; label: string }
> = {
  Male: { className: "gender-badge gender-badge--male", label: "Male" },
  Female: { className: "gender-badge gender-badge--female", label: "Female" },
  Other: { className: "gender-badge gender-badge--other", label: "Other" },
};

export function normalizeParticipantGender(
  value: string | undefined | null
): ParticipantGender {
  if (!value) return "Other";
  const match = GENDER_OPTIONS.find(
    (g) => g.toLowerCase() === String(value).trim().toLowerCase()
  );
  return match || "Other";
}

type Props = {
  gender: string | undefined | null;
  size?: "sm" | "md";
};

export default function GenderBadge({ gender, size = "sm" }: Props) {
  const normalized = normalizeParticipantGender(gender);
  const style = GENDER_STYLES[normalized];
  return (
    <span className={`${style.className}${size === "md" ? " gender-badge--md" : ""}`}>
      {style.label}
    </span>
  );
}

/** Smart suggest when relation changes (not locked) */
export function suggestGenderForRelation(relation: string): ParticipantGender | "" {
  if (relation === "wife") return "Female";
  return "";
}
