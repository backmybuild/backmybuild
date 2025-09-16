import React from "react";
import clsx from "clsx";
import { Heart } from "lucide-react"; // make sure lucide-react is installed
import { Transaction, useUserStore } from "../../stores/useUserStore";
import { formatUnits } from "viem";

const timeAgo = (iso: string) => {
  const s = Math.max(
    0,
    (Date.now() - new Date(Number(iso) * 1000).getTime()) / 1000
  );
  if (s < 60) return `${Math.floor(s)}s ago`;
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  const dt = new Date(iso);
  return dt.toLocaleDateString();
};

const Avatar: React.FC<{ name?: string; url?: string }> = ({ name, url }) => {
  const initials =
    name
      ?.trim()
      ?.split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "😊";
  return url ? (
    <img
      src={url}
      alt={name || "avatar"}
      className="h-10 w-10 rounded-full object-cover ring-1 ring-white/15"
    />
  ) : (
    <div className="h-10 w-10 rounded-full bg-white/10 grid place-items-center text-sm font-semibold ring-1 ring-white/15">
      {initials}
    </div>
  );
};

const Pill: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => (
  <span
    className={clsx(
      "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs",
      className
    )}
  >
    {children}
  </span>
);

// -------- Card (mobile-first) --------
const SupportCard: React.FC<{ s: Transaction }> = ({ s }) => (
  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/[.06] to-white/[.02] p-4 backdrop-blur-xl shadow-sm">
    <div className="flex items-center gap-3">
      <Avatar name={s.supporterName || "Anonymous"} url={s.avatarUrl} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">
            {s.supporterName || "Anonymous"}
          </p>
          <Pill>{timeAgo(s.blockTimestamp)}</Pill>
        </div>
        <p className="text-xs text-white/60 truncate">{s.txHash}</p>
      </div>
      {s.amount != null && (
        <div className="rounded-xl bg-white text-black px-3 py-1.5 text-sm font-semibold shadow">
          {formatUnits(BigInt(s.amount), 6)} USDC
        </div>
      )}
    </div>

    {s.message && (
      <p className="mt-3 text-sm leading-relaxed text-white/85">{s.message}</p>
    )}
  </div>
);

// -------- Table (desktop) --------
const SupportsTableDesktop: React.FC<{ data: Transaction[] }> = ({ data }) => (
  <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10">
    <table className="min-w-full bg-black/30">
      <thead className="bg-white/[.04] text-white/70 text-sm">
        <tr>
          <th className="px-4 py-3 text-left">Supporter</th>
          <th className="px-4 py-3 text-left">Message</th>
          <th className="px-4 py-3 text-left">Amount</th>
          <th className="px-4 py-3 text-left">When</th>
          <th className="px-4 py-3 text-left">Tx</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {data.map((s, i) => (
          <tr key={s.txHash + i} className="hover:bg-white/[.03]">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar
                  name={s.supporterName || "Anonymous"}
                  url={s.avatarUrl}
                />
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {s.supporterName || "Anonymous"}
                  </div>
                  <div className="text-xs text-white/60 truncate">{s.from}</div>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 max-w-[380px]">
              <p className="text-sm text-white/85 line-clamp-2">
                {s.message || "—"}
              </p>
            </td>
            <td className="px-4 py-3">
              {s.amount != null ? (
                <span className="font-semibold">
                  {formatUnits(BigInt(s.amount), 6)} USDC
                </span>
              ) : (
                "—"
              )}
            </td>
            <td className="px-4 py-3 text-white/80">
              {timeAgo(s.blockTimestamp)}
            </td>
            <td className="px-4 py-3">
              <code className="text-xs text-white/70">{s.txHash}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// -------- Main Section --------
const TransactionsPage: React.FC = () => {
  const isLoadingTransaction = useUserStore((state) => state.loading);
  const data = useUserStore((state) => state.user?.transactions || []);

  if (isLoadingTransaction) {
    return (
      <div className="min-h-[200px] w-full flex items-center justify-center">
        <div className="text-white/70">Loading transactions...</div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
      {/* Header */}
      {data.length > 0 && (
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Recent Supports</h2>
            <p className="text-sm text-white/60">All tips from your fans.</p>
          </div>
        </div>
      )}

      {data.length > 0 ? (
        <>
          {/* Mobile cards */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {data.map((s, i) => (
              <SupportCard key={s.txHash + i} s={s} />
            ))}
          </div>

          {/* Desktop table */}
          <SupportsTableDesktop data={data} />

          {/* Footer hint */}
          <div className="mt-6 text-center text-sm text-white/60">
            Share your page link to get more supporters ✨
          </div>
        </>
      ) : (
        <div className="text-center flex flex-col items-center gap-3">
          <Heart className="h-10 w-10 text-pink-500 opacity-80" />
          <p className="text-gray-400">
            You don&apos;t have any supporters yet.
          </p>
          <p className="text-gray-500">
            Share your profile link to get supporters.
          </p>
        </div>
      )}
    </section>
  );
};

export default TransactionsPage;
