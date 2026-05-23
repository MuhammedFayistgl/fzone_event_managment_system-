import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "fzone-theme";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
};

interface ThemeState {
  mode: ThemeMode;
}

const initialState: ThemeState = {
  mode: getInitialTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      localStorage.setItem(STORAGE_KEY, action.payload);
    },
    toggleTheme: (state) => {
      const next = state.mode === "light" ? "dark" : "light";
      state.mode = next;
      localStorage.setItem(STORAGE_KEY, next);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
