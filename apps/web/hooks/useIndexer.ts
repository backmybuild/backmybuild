import { useEffect, useRef, useState } from "react";
import { useUserStore } from "../stores/useUserStore";

export const useIndexer = () => {
  const workerRef = useRef<Worker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const user = useUserStore((s) => s.user);
  const sync = useUserStore((s) => s.sync);
  const [progress, setProgress] = useState<{
    currentBlock: bigint;
    syncToBlock: bigint;
  }>({
    currentBlock: 0n,
    syncToBlock: 0n,
  });

  useEffect(() => {
    if (!user?.viewingPrivateKey) return;
    const w = new Worker(new URL("../workers/indexer.ts", import.meta.url));
    workerRef.current = w;

    w.onmessage = (ev: MessageEvent) => {
      const msg = ev.data;
      if (msg.type === "NEW_BATCH") {
        sync(
          msg.payload.toBlock.toString(),
          msg.payload.newTransactions,
          msg.payload.newStealthAddresses
        );
        setProgress({
          currentBlock: msg.payload.latestBlock,
          syncToBlock: msg.payload.toBlock,
        });
      } else if (msg.type === "ERROR") {
        setError(msg.payload.message);
      }
    };

    w.postMessage({
      type: "START",
      payload: {
        viewingPrivateKey: user?.viewingPrivateKey,
        spendingPublicKey: user?.spendingPublicKey,
        syncToBlock: user?.syncToBlock || 0,
      },
    });

    // const onHide = () => {
    //   // optional: pause when tab hidden to save battery
    //   // w.postMessage({ type: "STOP" });
    // };
    // document.addEventListener("visibilitychange", onHide);

    return () => {
      w.postMessage({ type: "STOP" });
      w.terminate();
      // document.removeEventListener("visibilitychange", onHide);
    };
  }, [user]);

  return {
    progress,
    error,
  };
};
