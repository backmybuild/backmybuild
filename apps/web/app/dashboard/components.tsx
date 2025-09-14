// Modal primitive
function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-[#0b0b0b] border border-white/10 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold">{title ?? "Modal"}</h3>
          <button
            className="rounded-full w-8 h-8 bg-white/5 hover:bg-white/10"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Inputs
function Field({
  label,
  ...props
}: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm text-white/70">{label}</div>}
      <input
        {...props}
        className={`w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-white/20 ${props.className ?? ""}`}
      />
    </label>
  );
}

function TextArea({
  label,
  ...props
}: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm text-white/70">{label}</div>}
      <textarea
        {...props}
        className={`w-full min-h-[92px] rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20 ${props.className ?? ""}`}
      />
    </label>
  );
}

function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-10 px-4 hover:cursor-pointer rounded-xl bg-white text-black font-medium hover:bg-white/90 active:scale-[.99] ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-10 px-4 hover:cursor-pointer rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}