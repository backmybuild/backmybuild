import { useEffect, useRef } from "react";

// --- OTP Input (6 squares) ---
export function OtpInput({
    value,
    onChange,
    length = 6,
    disabled = false,
  }: {
    value: string;
    onChange: (v: string) => void;
    length?: number;
    disabled?: boolean;
  }) {
    const refs = useRef<Array<HTMLInputElement>>([]);
  
    useEffect(() => {
      refs.current = refs.current.slice(0, length);
    }, [length]);
  
    const toChars = (v: string) =>
      v.replace(/\D/g, "").slice(0, length).padEnd(length, " ").split("");
  
    const chars = toChars(value);
  
    const setAt = (idx: number, ch: string) => {
      const arr = chars.slice();
      arr[idx] = ch;
      onChange(arr.join("").replace(/\s/g, ""));
    };
  
    const focusIdx = (idx: number) => {
      refs.current[idx]?.focus();
      refs.current[idx]?.select?.();
    };
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
      const raw = e.target.value.replace(/\D/g, "");
      if (!raw) return setAt(i, " ");
      // If user pasted multiple digits into one box
      if (raw.length > 1) {
        const merged = (value + raw).replace(/\D/g, "").slice(0, length);
        onChange(merged);
        // focus next empty
        const next = Math.min(merged.length, length - 1);
        focusIdx(next);
        return;
      }
      setAt(i, raw);
      if (raw && i < length - 1) focusIdx(i + 1);
    };
  
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (chars[i].trim()) {
          setAt(i, " ");
          return;
        }
        if (i > 0) {
          setAt(i - 1, " ");
          focusIdx(i - 1);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (i > 0) focusIdx(i - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (i < length - 1) focusIdx(i + 1);
      } else if (!/^\d$/.test(e.key) && e.key.length === 1) {
        // block non-digits
        e.preventDefault();
      }
    };
  
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, i: number) => {
      e.preventDefault();
      const clip = e.clipboardData.getData("text").replace(/\D/g, "");
      if (!clip) return;
      const head = value.slice(0, i);
      const merged = (head + clip).replace(/\D/g, "").slice(0, length);
      onChange(merged);
      focusIdx(Math.min(i + clip.length, length - 1));
    };
  
    return (
      <div className="w-full">
        <div className="mb-1 text-sm text-white/70">OTP Code</div>
        <div className="flex gap-2">
          {Array.from({ length }).map((_, i) => (
            <input
              key={i}
              ref={(el: any) => ((refs.current[i] as any) = el)}
              value={chars[i].trim()}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={(e) => handlePaste(e, i)}
              onFocus={(e) => e.currentTarget.select()}
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              disabled={disabled}
              className="w-12 h-12 text-center text-xl rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-white/20"
            />
          ))}
        </div>
      </div>
    );
  }
  