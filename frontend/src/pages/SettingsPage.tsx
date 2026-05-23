import { Check, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import AppPageLayout from "../layouts/AppPageLayout";
import { useAppDispatch, useAppSelector } from "../hooks/hooks";
import { setTheme, type ThemeMode } from "../redux/store/slices/themeSlice";

const themes: { id: ThemeMode; label: string; description: string; icon: typeof Sun }[] = [
  {
    id: "light",
    label: "Light",
    description: "Clean dashboard with white cards and soft gray backgrounds.",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark — Premium Glass",
    description: "Refined glass surfaces with subtle cyan & fuchsia accents.",
    icon: Moon,
  },
];

function ThemePreview({ mode }: { mode: ThemeMode }) {
  if (mode === "dark") {
    return (
      <div className="relative h-24 rounded-xl mb-4 border border-app-border overflow-hidden bg-app-base">
        <div className="absolute inset-0 opacity-70 pointer-events-none">
          <div className="absolute top-0 left-0 w-20 h-20 bg-app-cyan/20 blur-2xl rounded-full" />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-app-fuchsia/20 blur-2xl rounded-full" />
        </div>
        <div className="relative p-3 flex gap-2">
          <div className="flex-1 h-14 rounded-lg app-card-raised" />
          <div className="w-8 h-14 rounded-lg bg-app-cyan/20 border border-app-cyan/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-24 rounded-xl mb-4 border border-app-border overflow-hidden bg-app-base">
      <div className="p-3 flex gap-2">
        <div className="flex-1 h-14 rounded-lg bg-app-surface border border-app-border shadow-sm" />
        <div className="w-8 h-14 rounded-lg bg-blue-100 border border-blue-200" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const current = useAppSelector((s) => s.theme.mode);

  return (
    <AppPageLayout title="Settings" subtitle="Customize your admin experience." embedded>
      <section className="max-w-3xl">
        <h2 className="text-lg font-semibold text-app-text mb-1">Appearance</h2>
        <p className="text-sm text-app-secondary mb-6">
          Choose how FZone looks across the entire app.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((theme) => {
            const selected = current === theme.id;
            const Icon = theme.icon;

            return (
              <motion.button
                key={theme.id}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => dispatch(setTheme(theme.id))}
                className={`text-left rounded-2xl border p-5 transition-all ${
                  selected
                    ? "border-app-cyan bg-[var(--color-selected-bg)] ring-2 ring-app-cyan/30"
                    : "border-app-border bg-app-surface hover:bg-[var(--color-card-hover)]"
                }`}
              >
                <ThemePreview mode={theme.id} />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-app-surface-muted border border-app-border flex items-center justify-center">
                      <Icon className="w-5 h-5 text-app-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-app-text">{theme.label}</p>
                      <p className="text-xs text-app-muted mt-1">{theme.description}</p>
                    </div>
                  </div>
                  {selected && (
                    <div className="w-6 h-6 rounded-full bg-app-cyan flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-app-base" />
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <p className="text-xs text-app-muted mt-6">
          Your preference is saved automatically and applied across all pages.
        </p>
      </section>
    </AppPageLayout>
  );
}
