export default function ErrorMessage({ msg }: { msg?: string }) {
  if (!msg) return null;

  return (
    <p className="text-red-500 text-xs mt-1">
      {msg}
    </p>
  );
}