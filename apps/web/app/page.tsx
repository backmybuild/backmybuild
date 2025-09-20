"use client";
import type { NextPage } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const LandingPage: NextPage = () => {
  return (
    <main className="min-h-screen transition-opacity duration-300">
      {/* Top nav */}
      <Nav />

      {/* Hero */}
      <section className="relative mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div
            className="
              inline-flex items-center gap-2 rounded-full
              border px-3 py-1 text-xs
              border-black/10 bg-black/5
              dark:border-white/10 dark:bg-white/5
            "
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live on{" "}
            <span className="font-semibold">Base</span>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
                Support creators with{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  private USDC tips
                </span>
              </h1>

              <p className="mt-4 text-lg text-black/70 dark:text-white/70">
                Stealth.Giving lets anyone donate on Base while keeping
                recipient addresses private. Set up a page, share it, and
                receive support via stealth addresses — no doxxing, no awkward
                wallet drops.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="
                    rounded-full px-5 py-2.5 text-sm font-semibold shadow
                    bg-black text-white hover:opacity-90
                    dark:bg-white dark:text-black
                  "
                >
                  Create your page
                </Link>
                <a
                  href="#privacy"
                  className="
                    rounded-full border px-5 py-2.5 text-sm
                    border-black/10 bg-black/5 hover:bg-black/10
                    dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10
                  "
                >
                  See how privacy works
                </a>
              </div>

              <div className="mt-6 flex items-center gap-4 text-sm text-black/60 dark:text-white/60">
                <div className="flex -space-x-2">
                  <span className="h-7 w-7 rounded-full border bg-black/5 border-black/10 dark:bg-white/10 dark:border-white/10" />
                  <span className="h-7 w-7 rounded-full border bg-black/5 border-black/10 dark:bg-white/10 dark:border-white/10" />
                  <span className="h-7 w-7 rounded-full border bg-black/5 border-black/10 dark:bg-white/10 dark:border-white/10" />
                </div>
                <span>Trusted by privacy-first creators</span>
              </div>
            </div>

            {/* Right mock card */}
            <div className="relative">
              <div
                className="
                  rounded-2xl p-5 backdrop-blur ring-1
                  bg-black/5 ring-black/10
                  dark:bg-white/5 dark:ring-white/10
                "
              >
                <div
                  className="
                    rounded-xl border p-4
                    bg-white text-black border-black/10
                    dark:bg-black dark:text-white dark:border-white/10
                  "
                >
                  <div className="text-sm text-black/60 dark:text-white/70">
                    stealth.giving/
                  </div>
                  <h3 className="text-2xl font-bold mt-1">your-name</h3>
                  <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                    “Thanks for supporting my work! Your tip helps me keep
                    building.”
                  </p>

                  <div className="mt-4 grid gap-2">
                    <button
                      className="
                        rounded-lg px-4 py-2 text-left
                        bg-black/5 hover:bg-black/10
                        dark:bg-white/10 dark:hover:bg-white/15
                      "
                    >
                      <div className="text-xs text-black/60 dark:text-white/60">
                        Suggested
                      </div>
                      <div className="text-lg font-semibold">10 USDC</div>
                    </button>

                    <button
                      className="
                        rounded-lg px-4 py-2 font-semibold
                        bg-black text-white hover:opacity-90
                        dark:bg-white dark:text-black
                      "
                    >
                      Send tip privately
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-black/60 dark:text-white/60">
                    Powered by stealth addresses · no wallet reveal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Human vibes */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Feel safe receiving",
              body: "Share a simple link, not your wallet. Fans can tip you without exposing your on-chain identity.",
              icon: "🫶",
            },
            {
              title: "Keep it human",
              body: "Add a photo, a short note, and suggested amounts. Make support feel like a high-five, not a checkout.",
              icon: "🙂",
            },
            {
              title: "No web3 gymnastics",
              body: "Donors just connect and send. You don’t manage invoices or spreadsheets.",
              icon: "⚡",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="
                rounded-2xl p-5 backdrop-blur ring-1
                bg-black/5 ring-black/10
                dark:bg-white/5 dark:ring-white/10
              "
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-2 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-black/70 dark:text-white/70">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how"
        className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              How it works
            </h2>
            <p className="mt-2 text-black/70 dark:text-white/70">
              Three simple steps to start receiving private tips.
            </p>
          </div>

          <div className="lg:col-span-2 grid gap-4">
            {[
              {
                n: 1,
                t: "Create your page",
                d: "Pick a name, add a note, and connect your wallet privately.",
              },
              {
                n: 2,
                t: "Share your link",
                d: "Post it anywhere — socials, streams, newsletters.",
              },
              {
                n: 3,
                t: "Receive privately",
                d: "Each tip creates a fresh stealth address that only you can claim.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="
                  flex items-start gap-4 rounded-2xl p-5 backdrop-blur ring-1
                  bg-black/5 ring-black/10
                  dark:bg-white/5 dark:ring-white/10
                "
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black text-white font-bold dark:bg-white dark:text-black">
                  {s.n}
                </div>
                <div>
                  <div className="font-semibold">{s.t}</div>
                  <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                    {s.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy focus */}
      <section
        id="privacy"
        className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12"
      >
        <div
          className="
            rounded-2xl p-6 backdrop-blur ring-1
            bg-black/5 ring-black/10
            dark:bg-white/5 dark:ring-white/10
          "
        >
          <div className="flex flex-col items-start gap-6 md:flex-row">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold">
                Privacy by default
              </h2>
              <p className="mt-2 text-black/70 dark:text-white/70">
                Stealth.Giving uses stealth address technology so your public
                address stays private. When someone sends you ETH, a unique
                one-time address is generated. You can claim funds from your
                wallet without revealing your main address.
              </p>
              <ul className="mt-4 grid gap-2 list-disc list-inside text-sm text-black/80 dark:text-white/80">
                <li>No public receiving address on your page</li>
                <li>Fresh stealth addresses for every tip</li>
                <li>You control when/where to consolidate funds</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="
                    rounded-full px-5 py-2.5 text-sm font-semibold shadow
                    bg-black text-white hover:opacity-90
                    dark:bg-white dark:text-black
                  "
                >
                  Create your page
                </Link>
                <a
                  href="#faq"
                  className="
                    rounded-full border px-5 py-2.5 text-sm
                    border-black/10 bg-black/5 hover:bg-black/10
                    dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10
                  "
                >
                  Read FAQ
                </a>
              </div>
            </div>

            <div className="w-full md:w-[360px]">
              <div
                className="
                  rounded-xl border p-4
                  bg-white text-black border-black/10
                  dark:bg-black dark:text-white dark:border-white/10
                "
              >
                <div className="text-sm text-black/60 dark:text-white/60">
                  Incoming tip
                </div>

                <div className="mt-2 rounded-lg p-3 bg-black/5 dark:bg-white/5">
                  <div className="text-xs text-black/60 dark:text-white/60">
                    Stealth address
                  </div>
                  <div className="font-mono text-sm truncate">
                    0x9c4d…a1f (one-time)
                  </div>
                </div>

                <div className="mt-2 rounded-lg p-3 bg-black/5 dark:bg-white/5">
                  <div className="text-xs text-black/60 dark:text-white/60">
                    Claimable by
                  </div>
                  <div className="text-sm">you (proof from your wallet)</div>
                </div>

                <div className="mt-3 text-xs text-black/60 dark:text-white/60">
                  Tip flows in → unique address → only you can withdraw.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold">What people say</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            "I love not sharing my wallet all over the internet.",
            "Fans tip me without asking for my address — it just works.",
            "Private tips feel safer. More people actually donate now.",
          ].map((q, i) => (
            <div
              key={i}
              className="
                rounded-2xl p-5 backdrop-blur ring-1
                bg-black/5 ring-black/10
                dark:bg:white/5 dark:ring-white/10
              "
            >
              <p className="text-black/80 dark:text-white/80">“{q}”</p>
              <div className="mt-3 text-sm text-black/60 dark:text-white/60">
                — Creator #{i + 1}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12"
      >
        <h2 className="text-2xl sm:text-3xl font-extrabold">FAQ</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            {
              q: "Do donors need to be on Base?",
              a: "Yes, tips are sent as ETH on Base for speed and low fees.",
            },
            {
              q: "Is my address ever shown?",
              a: "Your public page never reveals your main wallet. Each tip uses a fresh stealth address that only you can claim.",
            },
            {
              q: "Can I customize my page?",
              a: "Yes — add a bio, avatar, and suggested amounts to fit your vibe.",
            },
            {
              q: "Is this custodial?",
              a: "No. You control your keys and when you claim funds.",
            },
          ].map((it, i) => (
            <div
              key={i}
              className="
                rounded-2xl p-5 backdrop-blur ring-1
                bg-black/5 ring-black/10
                dark:bg-white/5 dark:ring-white/10
              "
            >
              <h3 className="font-semibold">{it.q}</h3>
              <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                {it.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default LandingPage;
