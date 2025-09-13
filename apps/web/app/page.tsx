/* eslint-disable  @typescript-eslint/no-explicit-any */
"use client";
import type { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

// If you have these in your codebase, you can keep them.
// Otherwise, feel free to remove BackgroundDecor / GlobalKeyframes and the <Logo /> usage.
import BackgroundDecor from "../components/BackgroundDecor";
import GlobalKeyframes from "../components/GlobalKeyframes";
import Logo from "../components/Logo";

// Optional: appkit wallet button (remove if unused)
// import { useAppKit } from "@reown/appkit/react";

const LandingPage: NextPage = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className={`min-h-screen bg-black text-white ${mounted ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}> 
      <BackgroundDecor />
      <GlobalKeyframes />

      {/* Top nav (minimal, friendly) */}
      <nav className="sticky top-0 z-30 bg-black/50 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold tracking-wide">Stealth.Giving</span>
          </Link>
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <a href="#how" className="hover:opacity-90 text-white/80">How it works</a>
            <a href="#privacy" className="hover:opacity-90 text-white/80">Privacy</a>
            <a href="#faq" className="hover:opacity-90 text-white/80">FAQ</a>
            <Link href="/login" className="rounded-full bg-white text-black px-3 py-1.5 font-semibold shadow hover:opacity-90">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live on <span className="font-semibold text-white">Base</span>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
                Support creators with <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">private USDC tips</span>
              </h1>
              <p className="mt-4 text-white/70 text-lg">
                Stealth.Giving lets anyone donate on Base while keeping recipient addresses private. Set up a page, share it, and receive support via stealth addresses — no doxxing, no awkward wallet drops.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/login" className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-semibold shadow hover:opacity-90">Create your page</Link>
                <a href="#privacy" className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm hover:bg-white/10">See how privacy works</a>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-white/60">
                <div className="flex -space-x-2">
                  <span className="h-7 w-7 rounded-full bg-white/10 border border-white/10" />
                  <span className="h-7 w-7 rounded-full bg-white/10 border border-white/10" />
                  <span className="h-7 w-7 rounded-full bg-white/10 border border-white/10" />
                </div>
                <span>Trusted by privacy‑first creators</span>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl bg-white/5 backdrop-blur p-5 ring-1 ring-white/10">
                <div className="rounded-xl bg-black p-4 border border-white/10">
                  <div className="text-sm text-white/70">stealt.giving/</div>
                  <h3 className="text-2xl font-bold mt-1">your-name</h3>
                  <p className="mt-2 text-white/70 text-sm">“Thanks for supporting my work! Your tip helps me keep building.”</p>
                  <div className="mt-4 grid gap-2">
                    <button className="rounded-lg bg-white/10 hover:bg-white/15 px-4 py-2 text-left">
                      <div className="text-xs text-white/60">Suggested</div>
                      <div className="text-lg font-semibold">10 USDC</div>
                    </button>
                    <button className="rounded-lg bg-white text-black px-4 py-2 font-semibold hover:opacity-90">Send tip privately</button>
                  </div>
                  <div className="mt-4 text-xs text-white/50">Powered by stealth addresses · no wallet reveal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Human vibes: reasons & feelings */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Feel safe receiving",
              body: "Share a simple link, not your wallet. Fans can tip you without exposing your on‑chain identity.",
              icon: "🫶",
            },
            {
              title: "Keep it human",
              body: "Add a photo, a short note, and suggested amounts. Make support feel like a high‑five, not a checkout.",
              icon: "🙂",
            },
            {
              title: "No web3 gymnastics",
              body: "Donors just connect and send. You don’t manage invoices or spreadsheets.",
              icon: "⚡",
            },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl bg-white/5 backdrop-blur p-5 ring-1 ring-white/10">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-2 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-white/70 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold">How it works</h2>
            <p className="mt-2 text-white/70">Three simple steps to start receiving private tips.</p>
          </div>
          <div className="lg:col-span-2 grid gap-4">
            {[{n:1,t:"Create your page",d:"Pick a name, add a note, and connect your wallet privately."},{n:2,t:"Share your link",d:"Post it anywhere — socials, streams, newsletters."},{n:3,t:"Receive privately",d:"Each tip creates a fresh stealth address that only you can claim."}].map((s)=> (
              <div key={s.n} className="rounded-2xl bg-white/5 backdrop-blur p-5 ring-1 ring-white/10 flex items-start gap-4">
                <div className="h-8 w-8 shrink-0 rounded-full bg-white text-black grid place-items-center font-bold">{s.n}</div>
                <div>
                  <div className="font-semibold">{s.t}</div>
                  <p className="text-sm text-white/70 mt-1">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy focus */}
      <section id="privacy" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl bg-white/5 backdrop-blur p-6 ring-1 ring-white/10">
          <div className="flex items-start gap-6 flex-col md:flex-row">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold">Privacy by default</h2>
              <p className="mt-2 text-white/70">
              Stealth.Giving uses stealth address technology so your public address stays private. When someone sends you ETH, a unique one‑time address is generated. You can claim funds from your wallet without revealing your main address.
              </p>
              <ul className="mt-4 grid gap-2 text-sm text-white/80 list-disc list-inside">
                <li>No public receiving address on your page</li>
                <li>Fresh stealth addresses for every tip</li>
                <li>You control when/where to consolidate funds</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/setup" className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-semibold shadow hover:opacity-90">Create your page</Link>
                <a href="#faq" className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm hover:bg-white/10">Read FAQ</a>
              </div>
            </div>
            <div className="md:w-[360px] w-full">
              <div className="rounded-xl bg-black p-4 border border-white/10">
                <div className="text-sm text-white/60">Incoming tip</div>
                <div className="mt-2 rounded-lg bg-white/5 p-3">
                  <div className="text-xs text-white/60">Stealth address</div>
                  <div className="font-mono text-sm truncate">0x9c4d…a1f (one‑time)</div>
                </div>
                <div className="mt-2 rounded-lg bg-white/5 p-3">
                  <div className="text-xs text-white/60">Claimable by</div>
                  <div className="text-sm">you (proof from your wallet)</div>
                </div>
                <div className="mt-3 text-xs text-white/50">Tip flows in → unique address → only you can withdraw.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / human notes */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold">What people say</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["I love not sharing my wallet all over the internet.","Fans tip me without asking for my address — it just works.","Private tips feel safer. More people actually donate now."].map((q,i)=> (
            <div key={i} className="rounded-2xl bg-white/5 backdrop-blur p-5 ring-1 ring-white/10">
              <p className="text-white/80">“{q}”</p>
              <div className="mt-3 text-sm text-white/60">— Creator #{i+1}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold">FAQ</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/5 backdrop-blur p-5 ring-1 ring-white/10">
            <h3 className="font-semibold">Do donors need to be on Base?</h3>
            <p className="text-white/70 text-sm mt-1">Yes, tips are sent as ETH on Base for speed and low fees.</p>
          </div>
          <div className="rounded-2xl bg-white/5 backdrop-blur p-5 ring-1 ring-white/10">
            <h3 className="font-semibold">Is my address ever shown?</h3>
            <p className="text-white/70 text-sm mt-1">Your public page never reveals your main wallet. Each tip uses a fresh stealth address that only you can claim.</p>
          </div>
          <div className="rounded-2xl bg-white/5 backdrop-blur p-5 ring-1 ring-white/10">
            <h3 className="font-semibold">Can I customize my page?</h3>
            <p className="text-white/70 text-sm mt-1">Yes — add a bio, avatar, and suggested amounts to fit your vibe.</p>
          </div>
          <div className="rounded-2xl bg-white/5 backdrop-blur p-5 ring-1 ring-white/10">
            <h3 className="font-semibold">Is this custodial?</h3>
            <p className="text-white/70 text-sm mt-1">No. You control your keys and when you claim funds.</p>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/setup" className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-semibold shadow hover:opacity-90">Create your page</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <Logo />
            <span>Stealth.Giving</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:opacity-90">Privacy</a>
            <a href="#faq" className="hover:opacity-90">FAQ</a>
            <Link href="/setup" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/10">Get started</Link>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
