export default function RouteDivider() {
  return (
    <div
      role="presentation"
      className="relative h-10 bg-white flex items-center justify-center overflow-hidden"
    >
      <div className="w-full max-w-4xl mx-4 border-t-2 border-dashed border-gray-200" />
      <div className="absolute w-3 h-3 rounded-full bg-secondary border-2 border-white ring-2 ring-primary/20" />
    </div>
  );
}
