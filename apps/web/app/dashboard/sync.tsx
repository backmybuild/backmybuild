import Link from "next/link";
import { useIndexer } from "../../hooks/useIndexer";
import { CHAIN } from "@stealthgiving/definition";

const Sync: React.FC = () => {
  const { progress, error } = useIndexer();
  const blockDiff = progress.currentBlock - progress.syncToBlock;
  if (error) {
    return <div className="text-sm text-red-400">Error: {error}</div>;
  }

  if (progress.syncToBlock === 0n) {
    return <div className="text-sm text-gray-400">Loading</div>;
  }
  return (
    <div
      className={`text-sm ${blockDiff > 500 ? "text-yellow-400" : "text-green-400"}`}
    >
      Synced to block:{" "}
      <Link
        className="underline decoration-dotted hover:opacity-80"
        href={
          CHAIN.blockExplorers.default.url + `/block/${progress.syncToBlock}`
        }
      >
        {progress.syncToBlock}
      </Link>{" "}
      {blockDiff > 500 &&
        `(${progress.currentBlock - progress.syncToBlock} blocks ahead)`}
    </div>
  );
};

export default Sync;
