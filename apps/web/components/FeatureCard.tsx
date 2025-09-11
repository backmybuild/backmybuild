const FeatureCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md hover:border-white/20 transition group">
    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-105 transition">
      {icon}
    </div>
    <h4 className="font-semibold mb-2">{title}</h4>
    <p className="text-sm text-white/70">{children}</p>
  </div>
);

export default FeatureCard;
