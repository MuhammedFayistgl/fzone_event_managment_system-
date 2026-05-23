import { Link } from "react-router";

export default function UnauthorizedPage() {
  return (
    <div className="app-page min-h-screen flex items-center justify-center px-4">
      <div className="app-card-raised p-8 text-center max-w-md w-full">
        <h1 className="app-heading text-3xl text-app-text">Unauthorized</h1>
        <p className="text-app-muted mt-2">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          to="/login"
          className="inline-block mt-6 text-sm font-medium text-app-cyan hover:opacity-80 transition"
        >
          Go to Login →
        </Link>
      </div>
    </div>
  );
}
