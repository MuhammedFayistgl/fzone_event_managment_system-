import { getApiBaseURL } from "../api/axios";

/** Resolve /uploads/... path to full URL for canvas Image load */
export function resolveUploadUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (
    path.startsWith("http://")
    || path.startsWith("https://")
    || path.startsWith("data:")
    || path.startsWith("blob:")
  ) {
    return path;
  }
  const base = getApiBaseURL().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
