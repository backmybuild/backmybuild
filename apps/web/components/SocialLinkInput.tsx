type SocialLinkInputProps = {
  label: string; // e.g. "X (Twitter)"
  prefix: string; // e.g. "https://x.com/"
  value: string; // the handle/slug only (e.g. "yourhandle")
  onChange: (v: string) => void;
  placeholder?: string; // default: "username"
};

export function SocialLinkInput({
  label,
  prefix,
  value,
  onChange,
  placeholder = "username",
}: SocialLinkInputProps) {
  // keep it clean: strip leading @ and slashes
  const cleaned = value.replace(/^@+/, "").replace(/^\/+/, "").trim();

  // build full URL (handles double slashes)
  const fullUrl = cleaned
    ? prefix.replace(/\/+$/, "/") + cleaned.replace(/^\/+/, "")
    : "";

  const displayPrefix =
    prefix.replace(/^https?:\/\//, "").replace(/\/+$/, "") + "/";

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-white/50">
        {label}
      </span>

      <div className="mt-1 flex items-center overflow-hidden rounded-xl border border-white/10 bg-white/5 focus-within:ring-2 focus-within:ring-cyan-400/40">
        <span className="shrink-0 px-3 text-sm text-white/60 border-r border-white/10 select-none">
          {displayPrefix}
        </span>

        <input
          className="field !border-0 !bg-transparent !ring-0 rounded-none flex-1"
          placeholder={placeholder}
          value={value}
          onChange={(e) =>
            onChange(e.target.value.replace(/^@+/, "").replace(/^\/+/, ""))
          }
        />

        {fullUrl && (
          <>
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2 text-xs text-white/70 hover:text-white underline decoration-dotted"
              title="Open link"
            >
              Open
            </a>
            <button
              type="button"
              className="icon-btn mr-2"
              title="Copy URL"
              onClick={() => navigator.clipboard?.writeText(fullUrl)}
            >
              ⎘
            </button>
          </>
        )}
      </div>

      {fullUrl && (
        <div className="mt-1 text-[11px] text-white/50 truncate">{fullUrl}</div>
      )}
    </label>
  );
}

export default SocialLinkInput;
