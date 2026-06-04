const styles: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-green-100 text-green-800",
  pending_payment: "bg-yellow-100 text-yellow-800",
  payment_received: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function Badge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const style = styles[status] ?? "bg-gray-100 text-gray-700";
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style} ${className}`}
    >
      {label}
    </span>
  );
}
