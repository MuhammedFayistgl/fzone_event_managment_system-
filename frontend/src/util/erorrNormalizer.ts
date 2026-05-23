import { ZodError } from "zod";

export const normalizeZodErrors = (error: ZodError) => {
  const formatted: any = {};

  error.issues.forEach((err) => {
    let current = formatted;

    err.path.forEach((key, index) => {
      if (index === err.path.length - 1) {
        current[key] = err.message;
      } else {
        if (!current[key]) {
          current[key] =
            typeof err.path[index + 1] === "number" ? [] : {};
        }
        current = current[key];
      }
    });
  });

  return formatted;
};