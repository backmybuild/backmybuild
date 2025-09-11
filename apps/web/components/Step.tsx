const Step = ({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) => (
  <li className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6">
    <div className="mb-3 flex items-center gap-3">
      <div className="h-7 w-7 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm">
        {number}
      </div>
      <h4 className="font-semibold">{title}</h4>
    </div>
    <p className="text-sm text-white/70">{children}</p>
  </li>
);

export default Step;
