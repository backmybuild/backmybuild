import Link from "next/link";
import { useUserStore } from "../../stores/useUserStore";
import { useEffect, useState } from "react";
import { useIndexer } from "../../hooks/useIndexer";
import { CHAIN, publicClient, USDC_ADDRESS } from "@stealthgiving/definition";
import Sync from "./sync";
import { erc20Abi, formatUnits } from "viem";

type Props = {
  profile: any;
  ensData: any | null;
  address: string;
  isAccountCreated: boolean;
  onCreateProfile: () => void;
  onWithdraw: () => void;
};

const InfoPage: React.FC<Props> = ({
  profile,
  ensData,
  address,
  isAccountCreated,
  onCreateProfile,
  onWithdraw,
}) => {
  const stealthAddresses = useUserStore(
    (state) => state.user?.stealthAddresses
  );
  const [balance, setBalance] = useState<bigint>(0n);

  const fetchBalance = async () => {
    if (!stealthAddresses || stealthAddresses.length === 0) return;
    const balances: any = await publicClient.multicall({
      contracts: stealthAddresses.map((addr) => ({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [addr.address],
      })),
    });
    const totalBalance = balances.reduce(
      (acc: bigint, curr: any) => acc + curr.result,
      0n
    );
    setBalance(totalBalance);
  };

  useEffect(() => {
    fetchBalance();
  }, [stealthAddresses]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)]; [background-size:20px_20px] opacity-10" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative">
        <div className="flex items-center gap-4">
          <img
            width={20}
            height={20}
            src={profile?.avatarUrl || "/avatar.png"}
            alt="avatar"
            className="w-20 h-20 rounded-2xl object-cover border border-white/10"
          />
          <div>
            <div className="text-2xl font-bold">
              Hi, {profile?.fullname || "User"}
            </div>
            <div className="text-sm text-white/70">
              <Link
                href={`/${ensData ? ensData : address}`}
                target="_blank"
                className="underline decoration-dotted hover:opacity-80"
              >
                {isAccountCreated
                  ? `https://stealth.giving/${ensData ? ensData : address}`
                  : "Account not created yet"}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAccountCreated ? (
            <div>
              <button
                className={`h-10 px-4 mr-2 hover:cursor-pointer rounded-4xl bg-white/5 text-white hover:bg-white/10 border border-white/10`}
                onClick={onCreateProfile}
              >
                Edit Profile
              </button>

              <button
                className={`h-10 px-4 hover:cursor-pointer rounded-4xl bg-white text-black font-medium hover:bg-white/90 active:scale-[.99]`}
              >
                Withdraw USDC
              </button>
            </div>
          ) : (
            <button
              className={`h-10 px-4 hover:cursor-pointer rounded-4xl bg-white text-black font-medium hover:bg-white/90 active:scale-[.99]`}
              onClick={onCreateProfile}
            >
              Create Profile
            </button>
          )}
        </div>
      </div>
      <div className="mt-6 sm:mt-6 max-w-lg">
        <h2 className="text-sm text-white/70">Earnings:</h2>
        <span className="block text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-[radial-gradient(100%_100%_at_0%_0%,_#fff,_#9be7ff_40%,_#7cfad2_70%,_#ffffff_100%)] drop-shadow-[0_0_25px_rgba(124,250,210,0.25)]">
          {formatUnits(balance, 6)} USDC
        </span>
      </div>
      {isAccountCreated && <Sync />}
    </section>
  );
};

export default InfoPage;
