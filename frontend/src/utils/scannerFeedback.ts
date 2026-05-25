export type ScanOutcome =
  | "success"
  | "alreadyCheckedIn"
  | "blocked"
  | "invalid"
  | "error";

export type ScannerAnnouncePrefs = {
  soundEnabled: boolean;
  voiceEnabled: boolean;
  volume: number;
  customMessages: Partial<Record<ScanOutcome, string>>;
};

export const SCAN_OUTCOMES: ScanOutcome[] = [
  "success",
  "alreadyCheckedIn",
  "blocked",
  "invalid",
  "error",
];

export const SCAN_OUTCOME_LABELS: Record<ScanOutcome, string> = {
  success: "Success",
  alreadyCheckedIn: "Already checked in",
  blocked: "Blocked",
  invalid: "Invalid pass",
  error: "Scan failed",
};

export const DEFAULT_ANNOUNCEMENTS: Record<ScanOutcome, string> = {
  success: "Access granted",
  alreadyCheckedIn: "Already checked in",
  blocked: "Entry blocked",
  invalid: "Invalid pass",
  error: "Scan failed",
};

const PREFS_KEY = "fzone:scannerAnnouncePrefs";

const DEFAULT_PREFS: ScannerAnnouncePrefs = {
  soundEnabled: true,
  voiceEnabled: true,
  volume: 0.8,
  customMessages: {},
};

export function getDefaultScannerAnnouncePrefs(): ScannerAnnouncePrefs {
  return {
    ...DEFAULT_PREFS,
    customMessages: { ...DEFAULT_PREFS.customMessages },
  };
}

export function loadScannerAnnouncePrefs(): ScannerAnnouncePrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return getDefaultScannerAnnouncePrefs();

    const parsed = JSON.parse(raw) as Partial<ScannerAnnouncePrefs>;
    return {
      soundEnabled: parsed.soundEnabled ?? DEFAULT_PREFS.soundEnabled,
      voiceEnabled: parsed.voiceEnabled ?? DEFAULT_PREFS.voiceEnabled,
      volume:
        typeof parsed.volume === "number"
          ? Math.min(1, Math.max(0, parsed.volume))
          : DEFAULT_PREFS.volume,
      customMessages: { ...(parsed.customMessages || {}) },
    };
  } catch {
    return getDefaultScannerAnnouncePrefs();
  }
}

export function saveScannerAnnouncePrefs(prefs: ScannerAnnouncePrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function resetScannerAnnounceMessages(
  prefs: ScannerAnnouncePrefs
): ScannerAnnouncePrefs {
  return { ...prefs, customMessages: {} };
}

type AnnounceContext = {
  name?: string;
};

export function resolveAnnouncementText(
  outcome: ScanOutcome,
  prefs: ScannerAnnouncePrefs,
  context?: AnnounceContext
): string {
  const template =
    prefs.customMessages[outcome]?.trim() ||
    DEFAULT_ANNOUNCEMENTS[outcome];

  const name = context?.name?.trim() || "Guest";
  return template.replace(/\{name\}/gi, name);
}

export function getEffectiveAnnouncementText(
  outcome: ScanOutcome,
  prefs: ScannerAnnouncePrefs
): string {
  return (
    prefs.customMessages[outcome]?.trim() ||
    DEFAULT_ANNOUNCEMENTS[outcome]
  );
}

type VerifyQrErrorPayload = {
  message?: string;
  alreadyCheckedIn?: boolean;
  blocked?: boolean;
};

export function classifyVerifyQrError(
  payload: VerifyQrErrorPayload | undefined,
  fallbackMessage?: string
): ScanOutcome {
  if (payload?.alreadyCheckedIn) return "alreadyCheckedIn";
  if (payload?.blocked) return "blocked";

  const message = (payload?.message || fallbackMessage || "").toLowerCase();

  if (
    message.includes("invalid qr") ||
    message.includes("qr token required") ||
    message.includes("invalid qr format")
  ) {
    return "invalid";
  }

  return "error";
}

export function classifyScanError(err: unknown): ScanOutcome {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";

  const lower = message.toLowerCase();
  if (
    lower.includes("invalid qr") ||
    lower.includes("qr token required") ||
    lower.includes("invalid qr format")
  ) {
    return "invalid";
  }

  return "error";
}

function playTone(
  frequency: number,
  durationMs: number,
  volume: number,
  type: OscillatorType = "sine"
): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = Math.min(1, Math.max(0, volume)) * 0.12;

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      setTimeout(() => {
        osc.stop();
        void ctx.close();
        resolve();
      }, durationMs);
    } catch {
      resolve();
    }
  });
}

/** Web Audio beeps — no external mp3 files required. */
export async function playOutcomeBeep(
  outcome: ScanOutcome,
  volume = 0.8
): Promise<void> {
  switch (outcome) {
    case "success":
      await playTone(880, 90, volume);
      await playTone(1100, 120, volume);
      break;
    case "alreadyCheckedIn":
      await playTone(440, 100, volume);
      await playTone(440, 100, volume);
      break;
    case "blocked":
    case "invalid":
    case "error":
      await playTone(660, 80, volume);
      await playTone(330, 140, volume, "triangle");
      break;
  }
}

/** Uses speechSynthesis; requires prior user gesture (camera open tap). */
export function speakAnnouncement(
  text: string,
  options?: { volume?: number; rate?: number }
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = options?.rate ?? 1;
  utterance.volume = Math.min(1, Math.max(0, options?.volume ?? 0.8));

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export async function triggerScanFeedback(
  outcome: ScanOutcome,
  prefs: ScannerAnnouncePrefs,
  context?: AnnounceContext
): Promise<void> {
  const text = resolveAnnouncementText(outcome, prefs, context);

  if (prefs.soundEnabled) {
    await playOutcomeBeep(outcome, prefs.volume);
  }

  if (prefs.voiceEnabled && text) {
    // Short delay helps Android play TTS after Web Audio beep.
    setTimeout(() => {
      speakAnnouncement(text, { volume: prefs.volume });
    }, prefs.soundEnabled ? 150 : 0);
  }
}

export async function testScanFeedback(
  outcome: ScanOutcome,
  prefs: ScannerAnnouncePrefs,
  message: string
): Promise<void> {
  if (prefs.soundEnabled) {
    await playOutcomeBeep(outcome, prefs.volume);
  }

  if (prefs.voiceEnabled && message.trim()) {
    setTimeout(() => {
      speakAnnouncement(message.trim(), { volume: prefs.volume });
    }, prefs.soundEnabled ? 150 : 0);
  }
}
