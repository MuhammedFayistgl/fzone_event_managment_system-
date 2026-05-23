import { useEffect, type ReactNode } from "react";
import { CustomProvider } from "rsuite";
import { useAppSelector } from "../hooks/hooks";

type Props = {
  children: ReactNode;
};

export default function ThemeProvider({ children }: Props) {
  const mode = useAppSelector((s) => s.theme.mode);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.body.dataset.theme = mode;
  }, [mode]);

  return (
    <CustomProvider theme={mode === "dark" ? "dark" : "light"}>
      {children}
    </CustomProvider>
  );
}
