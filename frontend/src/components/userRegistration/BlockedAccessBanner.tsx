import { ShieldOff } from "lucide-react";

type BlockedGuest = {
  name: string;
  reason?: string;
};

type Props = {
  investorBlocked?: boolean;
  investorReason?: string;
  blockedGuests?: BlockedGuest[];
};

export default function BlockedAccessBanner({
  investorBlocked = false,
  investorReason,
  blockedGuests = [],
}: Props) {
  if (!investorBlocked && blockedGuests.length === 0) return null;

  return (
    <div className="user-blocked-banner space-y-3">
      {investorBlocked && (
        <div className="flex gap-3">
          <div className="user-blocked-banner__icon" aria-hidden>
            <ShieldOff size={20} />
          </div>
          <div>
            <p className="user-blocked-banner__title">Investor entry blocked</p>
            <p className="user-blocked-banner__text">
              {investorReason ||
                "Your investor pass access has been revoked. Contact support if you believe this is a mistake."}
            </p>
          </div>
        </div>
      )}

      {blockedGuests.map((guest) => (
        <div key={guest.name} className="flex gap-3">
          <div className="user-blocked-banner__icon" aria-hidden>
            <ShieldOff size={20} />
          </div>
          <div>
            <p className="user-blocked-banner__title">
              Guest entry blocked — {guest.name}
            </p>
            <p className="user-blocked-banner__text">
              {guest.reason ||
                "This guest cannot enter because the remaining payment balance does not cover their pass after a refund."}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
