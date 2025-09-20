"use client";
import { useMemo, useState } from "react";
import { useUserStore } from "../../stores/useUserStore";

type StealthAddr = { address: string; balance: number };

const sampleData: StealthAddr[] = [
  { address: "0x8e7F7aE9d2fA3C4bA92C4c5E1F9b0A1b2c3D4E5f", balance: 123.45 },
  { address: "0xAbCdEf1234567890aBCdef1234567890abCDef12", balance: 42.01 },
  { address: "0x9999999999999999999999999999999999999999", balance: 7.5 },
];

const fmtAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const Withdraw = () => {
  const isLoading = useUserStore((s) => s.loading);
  const storeStealth = useUserStore(
    (s) => s.user?.stealthAddresses as StealthAddr[] | undefined
  );
  const stealthList = sampleData;

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMap, setSelectedMap] = useState<Record<string, StealthAddr>>(
    {}
  );
  const [receiverAddress, setReceiverAddress] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const selectedArr = useMemo(() => Object.values(selectedMap), [selectedMap]);
  const totalSelected = useMemo(
    () => selectedArr.reduce((s, a) => s + (a.balance || 0), 0),
    [selectedArr]
  );

  const canNext =
    step === 1 ? selectedArr.length > 0 : receiverAddress.trim().length > 0;
  const isDisabled = isLoading || isWithdrawing;

  const FEE_PER_ADDR = 0.01; // USDC
  const feeTotal = useMemo(
    () => selectedArr.length * FEE_PER_ADDR,
    [selectedArr.length]
  );
  const netAmount = useMemo(
    () => Math.max(totalSelected - feeTotal, 0),
    [totalSelected, feeTotal]
  );

  const toggleSelect = (item: StealthAddr) =>
    setSelectedMap((m) => {
      const next = { ...m };
      if (next[item.address]) delete next[item.address];
      else next[item.address] = item;
      return next;
    });

  const selectAll = () =>
    setSelectedMap(() =>
      stealthList.reduce((acc, it) => ({ ...acc, [it.address]: it }), {})
    );
  const clearAll = () => setSelectedMap({});

  const handleNext = () => {
    if (step === 1) setStep(2);
    else handleWithdraw();
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    // Hook real action here: selectedArr, receiverAddress
    setTimeout(() => setIsWithdrawing(false), 1000);
  };

  return (
    <div className="bg-[#000000] p-6 w-11/12 max-w-lg mx-auto rounded-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Withdraw USDC – Base</h2>
      </div>

      {/* Stepper */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <div
          className={`h-6 px-2 rounded-full border ${step === 1 ? "bg-white text-black border-white" : "border-white/20 text-white/70"}`}
        >
          1. Select addresses
        </div>
        <div className="text-white/30">→</div>
        <div
          className={`h-6 px-2 rounded-full border ${step === 2 ? "bg-white text-black border-white" : "border-white/20 text-white/70"}`}
        >
          2. Receiver & confirm
        </div>
      </div>

      {step === 1 ? (
        <>
          {/* Actions */}
          <div className="mt-4 mb-2 flex items-center justify-between text-xs">
            <div className="text-white/70">
              Selected: <span className="text-white">{selectedArr.length}</span>{" "}
              • Total:{" "}
              <span className="text-white">{fmtUsd(totalSelected)} USDC</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
                onClick={selectAll}
                disabled={isDisabled}
              >
                Select all
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
                onClick={clearAll}
                disabled={isDisabled}
              >
                Clear
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {stealthList.map((item) => {
              const isActive = !!selectedMap[item.address];
              return (
                <button
                  key={item.address}
                  type="button"
                  onClick={() => toggleSelect(item)}
                  className={`w-full text-left rounded-xl p-3 border transition
                    ${isActive ? "border-white bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  disabled={isDisabled}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center h-5 w-5 rounded-md border text-[10px]
                          ${isActive ? "bg-white text-black border-white" : "border-white/40 text-white/60"}`}
                      >
                        {isActive ? "✓" : ""}
                      </span>
                      <div>
                        <div className="text-sm">{fmtAddr(item.address)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {fmtUsd(item.balance)} USDC
                      </div>
                      <div className={`text-xs text-emerald-400`}>
                        Available
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {stealthList.length === 0 && (
              <div className="rounded-xl border border-white/10 p-4 text-center text-sm text-white/70">
                No stealth addresses yet.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Selected summary */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="text-white/70">Selected</div>
              <div className="text-white/80">
                {selectedArr.length} addresses
              </div>
            </div>

            <div className="max-h-28 overflow-y-auto space-y-1 text-xs">
              {selectedArr.map((s) => (
                <div
                  key={s.address}
                  className="flex items-center justify-between"
                >
                  <span className="text-white/80">{fmtAddr(s.address)}</span>
                  <span className="text-white/70">
                    {fmtUsd(s.balance)} USDC
                  </span>
                </div>
              ))}
            </div>

            {/* totals */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-sm">
              <div className="text-white/70">Subtotal</div>
              <div className="font-medium">{fmtUsd(totalSelected)} USDC</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-white/70">
                Fee (0.01 × {selectedArr.length})
              </div>
              <div className="font-medium">-{fmtUsd(feeTotal)} USDC</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-white/70">Net to receive</div>
              <div className="font-semibold">{fmtUsd(netAmount)} USDC</div>
            </div>
          </div>

          {/* Receiver input */}
          <label className="block">
            <div className="mb-1 text-sm text-white/70">Receiver Address</div>
            <input
              placeholder="0x… (EVM address)"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-white/20"
              disabled={isDisabled}
            />
          </label>

          {netAmount <= 0 && (
            <div className="text-xs text-amber-400">
              Net amount is 0 after fees. Select addresses with balance.
            </div>
          )}
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex items-center justify-between gap-2 pt-5">
        <button
          type="button"
          className="h-10 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm"
          onClick={() => setStep(1)}
          disabled={step === 1 || isDisabled}
        >
          Back
        </button>
        <button
          type="button"
          className="h-10 px-4 rounded-xl bg-white text-black font-medium hover:bg-white/90 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleNext}
          disabled={
            isDisabled ||
            !canNext ||
            (step === 2 && (totalSelected <= 0 || selectedArr.length === 0))
          }
        >
          {step === 1
            ? "Next"
            : isWithdrawing
              ? "Withdrawing..."
              : "Confirm Withdraw"}
        </button>
      </div>

      {step === 2 && totalSelected <= 0 && (
        <div className="mt-3 text-xs text-amber-400">
          All selected addresses have 0 balance.
        </div>
      )}
    </div>
  );
};

export default Withdraw;
