const BackgroundDecor = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.20),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.16),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(34,211,238,0.12),transparent_35%)]" />
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
  </div>
);

export default BackgroundDecor;
