"use client";
import { use, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status])

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await signIn("google", { callbackUrl: "/dashboard" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-emerald-400 to-sky-500" />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-25 bg-gradient-to-br from-fuchsia-500 to-rose-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
          {/* Logo + Title */}
          <div className="flex flex-col items-center gap-3">
            <div className="size-14 rounded-2xl bg-white/10 grid place-items-center">
              {/* Replace with your logo if you have one */}
              <span className="text-xl font-bold">⛽</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Fuel Me</h1>
            <p className="text-white/70 text-sm text-center max-w-xs">
              Privacy-first tipping. Sign in to set up your page and start
              receiving donations securely.
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-8">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white text-black font-medium py-3 hover:opacity-90 active:scale-[0.99] transition disabled:opacity-60"
            >
              <Image
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                width={20}
                height={20}
              />
              {loading ? "Signing in…" : "Sign in with Google"}
            </button>

            {/* Optional terms line */}
            <p className="mt-4 text-center text-xs text-white/60">
              By continuing, you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </div>

        {/* Footer mini brand */}
        <p className="mt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Fuel Me
        </p>
      </div>
    </main>
  );
}
