function IsClosed() {
  return (
    <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
      <p className="text-red-400 font-semibold">Registration Closed</p>
      <p className="text-sm text-red-300/80 mt-1">
        This event is no longer accepting registrations
      </p>
    </div>
  );
}

export default IsClosed;
