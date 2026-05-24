import { UserRound, UserCircle2, Sparkles } from "lucide-react";

type GenderCounts = {
  male?: number;
  female?: number;
  other?: number;
};

type Props = {
  breakdown?: {
    investors?: GenderCounts;
    guests?: GenderCounts;
    total?: GenderCounts;
    totalHeadcount?: number;
  };
  compact?: boolean;
};

export default function RegistrationGenderStats({ breakdown, compact }: Props) {
  if (!breakdown?.total) return null;

  const { total, investors, guests } = breakdown;

  const chips = [
    { label: "Male", value: total.male ?? 0, icon: UserRound, variant: "male" as const },
    { label: "Female", value: total.female ?? 0, icon: UserCircle2, variant: "female" as const },
    { label: "Other", value: total.other ?? 0, icon: Sparkles, variant: "other" as const },
  ];

  return (
    <div className={`registration-gender-stats${compact ? " registration-gender-stats--compact" : ""}`}>
      <p className="registration-gender-stats__title">Registration by gender</p>
      <div className="registration-gender-stats__grid">
        {chips.map((chip) => (
          <div
            key={chip.label}
            className={`registration-gender-stats__chip registration-gender-stats__chip--${chip.variant}`}
          >
            <chip.icon size={14} aria-hidden />
            <div>
              <p className="registration-gender-stats__chip-label">{chip.label}</p>
              <p className="registration-gender-stats__chip-value tabular-nums">{chip.value}</p>
            </div>
          </div>
        ))}
      </div>
      {!compact && investors && guests && (
        <p className="registration-gender-stats__sub">
          Investors: {(investors.male ?? 0) + (investors.female ?? 0) + (investors.other ?? 0)} · Guests:{" "}
          {(guests.male ?? 0) + (guests.female ?? 0) + (guests.other ?? 0)} · Total headcount:{" "}
          {breakdown.totalHeadcount ?? 0}
        </p>
      )}
    </div>
  );
}
