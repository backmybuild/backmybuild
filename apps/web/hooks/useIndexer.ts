import { useEffect, useRef, useState } from "react";
import { useUserStore } from "../stores/useUserStore";

export const useIndexer = () => {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    if (!user?.viewingPrivateKey) return;
    const w = new Worker(
      new URL("../workers/indexer.ts", import.meta.url)
    );
    workerRef.current = w;

    w.onmessage = (ev: MessageEvent) => {
      const msg = ev.data;
      console.log("Worker message:", msg);
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
    status
  };
};
