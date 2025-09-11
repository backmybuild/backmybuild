const FaqItem = ({ q, a }: { q: string; a: string }) => (
  <details className="group py-4">
    <summary className="flex cursor-pointer list-none items-center justify-between">
      <span className="font-medium">{q}</span>
      <span className="ml-4 text-white/50 group-open:rotate-180 transition">
        ⌄
      </span>
    </summary>
    <p className="mt-2 text-sm text-white/70">{a}</p>
  </details>
);

export default FaqItem;
