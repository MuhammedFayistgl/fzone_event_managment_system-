/**
 * Centralized Express error handler — consistent JSON responses.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
}

export function errorHandler(err, req, res, _next) {
  if (err?.message?.startsWith("CORS not allowed")) {
    return res.status(403).json({ success: false, message: err.message });
  }

  const status = err.status || err.statusCode || 500;
  const message =
    status >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  if (status >= 500) {
    console.error("[ERROR]", req.method, req.path, err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(err.code ? { code: err.code } : {}),
    ...(err.details ? { details: err.details } : {}),
  });
}
