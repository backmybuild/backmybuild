import Link from "next/link";

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
      <div className="mt-6 sm:mt-3 max-w-lg">
        <h2 className="text-sm text-white/70">Earnings</h2>
        <span className="block text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-[radial-gradient(100%_100%_at_0%_0%,_#fff,_#9be7ff_40%,_#7cfad2_70%,_#ffffff_100%)] drop-shadow-[0_0_25px_rgba(124,250,210,0.25)]">
          120.50 USDC
        </span>
      </div>
      <div className="mt-2 text-sm text-white/70">
        You do so well, keep it up! 🚀
      </div>
    </section>
  );
};

export default InfoPage;
