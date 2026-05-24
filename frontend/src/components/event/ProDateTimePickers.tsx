import type { ReactNode } from "react";
import { useMemo } from "react";
import { InputAdornment } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useAppSelector } from "../../hooks/hooks";

const darkPickerTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#22d3ee" },
    background: {
      default: "#0b1220",
      paper: "#151f2e",
    },
    text: {
      primary: "#e2e8f0",
      secondary: "#94a3b8",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "inherit",
  },
  components: {
    MuiPopper: {
      styleOverrides: {
        root: {
          zIndex: 1500,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--color-bg-input, rgba(15, 23, 42, 0.6))",
        },
      },
    },
  },
});

const lightPickerTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0891b2" },
    background: {
      default: "#f8f9fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#1f2937",
      secondary: "#6b7280",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "inherit",
  },
  components: {
    MuiPopper: {
      styleOverrides: {
        root: {
          zIndex: 1500,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--color-bg-input, #ffffff)",
        },
        notchedOutline: {
          borderColor: "#cbd5e1",
          borderWidth: "1px",
        },
      },
    },
  },
});

type PickerVariant = "default" | "schedule";

const fieldSlotProps = (name?: string, variant: PickerVariant = "default", icon?: ReactNode) => ({
  textField: {
    name,
    fullWidth: true,
    size: variant === "schedule" ? ("medium" as const) : ("small" as const),
    className: variant === "schedule" ? "pro-mui-picker-field pro-mui-picker-field--schedule" : "pro-mui-picker-field",
    InputProps: icon
      ? {
          startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
        }
      : undefined,
  },
  popper: {
    className: variant === "schedule" ? "pro-mui-picker-popper pro-mui-picker-popper--schedule" : "pro-mui-picker-popper",
  },
  layout: {
    className: "pro-mui-picker-layout",
  },
  actionBar: {
    actions: ["clear", "accept"] as ("clear" | "accept")[],
  },
});

type BaseProps = {
  name?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  variant?: PickerVariant;
};

export function ProPickerProvider({ children }: { children: ReactNode }) {
  const mode = useAppSelector((s) => s.theme.mode);
  const theme = useMemo(
    () => (mode === "dark" ? darkPickerTheme : lightPickerTheme),
    [mode]
  );
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export function ProDateField({
  name,
  label,
  value,
  onChange,
  disabled,
  minDate,
  variant = "default",
}: BaseProps & {
  value: Date | null;
  onChange: (value: Date | null) => void;
  minDate?: Date;
}) {
  const isSchedule = variant === "schedule";
  return (
    <DatePicker
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      minDate={minDate}
      format={isSchedule ? "EEE, MMM d, yyyy" : undefined}
      openTo="day"
      views={["year", "month", "day"]}
      slotProps={fieldSlotProps(
        name,
        variant,
        isSchedule ? <CalendarTodayOutlinedIcon fontSize="small" /> : undefined
      )}
      className={isSchedule ? "pro-mui-picker pro-mui-picker--schedule" : "pro-mui-picker"}
    />
  );
}

export function ProTimeField({
  name,
  label,
  value,
  onChange,
  disabled,
  variant = "default",
}: BaseProps & {
  value: Date | null;
  onChange: (value: Date | null) => void;
}) {
  const isSchedule = variant === "schedule";
  return (
    <TimePicker
      label={label}
      ampm
      value={value}
      onChange={onChange}
      disabled={disabled}
      format={isSchedule ? "h:mm aa" : undefined}
      views={["hours", "minutes"]}
      timeSteps={{ minutes: 5 }}
      slotProps={fieldSlotProps(
        name,
        variant,
        isSchedule ? <ScheduleOutlinedIcon fontSize="small" /> : undefined
      )}
      className={isSchedule ? "pro-mui-picker pro-mui-picker--schedule" : "pro-mui-picker"}
    />
  );
}

export function ProDateTimeField({
  name,
  label,
  value,
  onChange,
  disabled,
  minDateTime,
}: BaseProps & {
  value: Date | null;
  onChange: (value: Date | null) => void;
  minDateTime?: Date;
}) {
  return (
    <DateTimePicker
      label={label}
      ampm
      value={value}
      onChange={onChange}
      disabled={disabled}
      minDateTime={minDateTime}
      format="MMM d, yyyy · h:mm aa"
      slotProps={fieldSlotProps(name, "default", <EventOutlinedIcon fontSize="small" />)}
      className="pro-mui-picker"
    />
  );
}

/** Stable HH:mm for Redux / API (no timezone drift from toTimeString) */
export function formatTimeHHMM(value: Date | null): string | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

/** Reference date for time-only pickers when event day date not set yet */
export function withTimeOnDate(baseDate: Date | null, time: Date | null): Date | null {
  if (!time || Number.isNaN(time.getTime())) return null;
  const ref = baseDate && !Number.isNaN(baseDate.getTime()) ? new Date(baseDate) : new Date();
  ref.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return ref;
}
