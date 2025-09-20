// app/(or pages)/landing.tsx — Single‑file landing page
// Requirements met: light/dark themes (via next-themes), floating glass nav, animations (framer‑motion),
// minimal copy, image‑heavy look with decorative mock cards and galleries.
//
// Deps: tailwindcss, framer-motion, next-themes, lucide-react
// bun add framer-motion next-themes lucide-react  (or npm i)

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Moon, Sun, ShieldCheck, Coins, Lock } from "lucide-react";
import NavBar from "../../components/Nav";

// Floating Glass Navbar (animated "drop & open")
// -------------------------------
const navContainer = {
  hidden: { opacity: 0, y: -40, scale: 0.95, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 22,
      bounce: 0.35,
      duration: 0.6,
      when: "beforeChildren",
      delayChildren: 0.08,
      staggerChildren: 0.05,
    },
  },
};
const navItem = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 500, damping: 28, duration: 0.35 } },
};

// -------------------------------
// Hero Section (minimal copy, image‑forward)
// -------------------------------
function Hero() {
  // Parallax blobs
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 400], [0, 40]);
  const y2 = useTransform(scrollY, [0, 400], [0, -30]);

  return (
    <section className="relative isolate overflow-hidden pt-36 sm:pt-40">
      {/* background gradient + blobs */}
      <motion.div style={{ y: y1 }} className="pointer-events-none absolute -top-24 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-cyan-400/40 via-blue-400/30 to-purple-400/30 blur-3xl dark:from-cyan-300/10 dark:via-blue-300/10 dark:to-purple-300/10" />
      <motion.div style={{ y: y2 }} className="pointer-events-none absolute top-20 right-10 h-60 w-60 rounded-full bg-white/50 blur-3xl dark:bg-white/10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          {/* Left: tagline */}
          <div className="text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-semibold leading-tight tracking-tight text-black/90 dark:text-white sm:text-5xl"
            >
              Receive crypto donations
              <br />
              <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">Easily, Privacy and Seamlessly</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-base text-black/60 dark:text-white/70"
            >
              One link. Stealth addresses per donor. Transparent on‑chain, private totals.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="mt-6 flex items-center justify-center gap-3 md:justify-start">
              <Link href="/dashboard" className="relative inline-flex items-center rounded-full border border-black/10 bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:opacity-90 dark:border-white/10 dark:bg-white dark:text-black">
                Get Started
              </Link>
              <Link href="#how" className="rounded-full border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold text-black backdrop-blur-md transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                How it works
              </Link>
            </motion.div>

            {/* quick trust badges minimal */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/60 px-3 py-1 text-xs text-black/80 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-white/80"><ShieldCheck className="h-4 w-4" /> Self-custody</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/60 px-3 py-1 text-xs text-black/80 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-white/80"><Lock className="h-4 w-4" /> Stealth Address</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/60 px-3 py-1 text-xs text-black/80 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-white/80"><Coins className="h-4 w-4" /> Base‑ready</span>
            </div>
          </div>

          {/* Right: Image stack (mock screens/cards) */}
          <div className="relative grid place-items-center">
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -6 }}
              animate={{ opacity: 1, y: 0, rotate: -6 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative h-64 w-56 rounded-3xl border border-white/20 bg-gradient-to-br from-white to-white/70 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:from-white/10 dark:to-white/5 md:h-80 md:w-72"
            >
              <div className="h-full w-full rounded-2xl bg-[radial-gradient(80%_60%_at_50%_0%,rgba(0,0,0,0.06),transparent)] p-4 dark:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(255,255,255,0.06),transparent)]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500" />
                  <div>
                    <div className="h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
                    <div className="mt-1 h-2 w-16 rounded bg-black/10 dark:bg-white/10" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-white/20 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-white/10">
                      <div className="h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
                      <div className="h-3 w-10 rounded bg-black/10 dark:bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40, rotate: 8 }}
              animate={{ opacity: 1, y: 0, rotate: 8 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="absolute -bottom-8 left-10 h-40 w-52 rounded-3xl border border-white/20 bg-white/80 p-3 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/10 md:h-56 md:w-64"
            >
              <div className="h-full w-full rounded-2xl bg-[conic-gradient(from_180deg_at_50%_50%,#e9d5ff_0%,#99f6e4_50%,#bfdbfe_100%)] opacity-60" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="absolute -right-4 top-10 h-24 w-24 rounded-2xl border border-white/20 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/10"
            />
          </div>
        </div>
      </div>

      {/* subtle divider */}
      <div className="mx-auto mt-16 h-px max-w-6xl bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
    </section>
  );
}

// -------------------------------
// Showcase (image grid, minimal captions)
// -------------------------------
function Showcase() {
  const tiles = Array.from({ length: 8 }).map((_, i) => i);
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-xl font-semibold text-black/90 dark:text-white">Made for creators, builders, communities</h2>
          <span className="text-sm text-black/60 dark:text-white/70">Less talk, more visuals</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {tiles.map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-black/10 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10"
            >
              {/* Replace with your screenshots */}
              <Image
                src={`https://picsum.photos/seed/sg-${i}/800/600`}
                alt="Showcase"
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------------------------------
// How it works (3 steps with icons + tiny copy)
// -------------------------------
function HowItWorks() {
  const steps = [
    { title: "Create your link", desc: "Connect wallet, customize page.", icon: <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 p-3"><Lock className="h-5 w-5 text-white" /></div> },
    { title: "Share anywhere", desc: "Fans tip in crypto.", icon: <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-teal-400 p-3"><Coins className="h-5 w-5 text-white" /></div> },
    { title: "Stay private", desc: "Each donor → new stealth address.", icon: <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 p-3"><ShieldCheck className="h-5 w-5 text-white" /></div> },
  ];
  return (
    <section id="how" className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10"
            >
              <div className="flex items-center gap-3">
                {s.icon}
                <h3 className="text-base font-semibold text-black/90 dark:text-white">{s.title}</h3>
              </div>
              <p className="mt-2 text-sm text-black/60 dark:text-white/70">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------------------------------
// Privacy blurb (minimal)
// -------------------------------
function Privacy() {
  return (
    <section id="privacy" className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-black/10 bg-white/70 p-8 text-center backdrop-blur dark:border-white/10 dark:bg-white/10">
          <h3 className="text-lg font-semibold text-black/90 dark:text-white">Privacy, by design</h3>
          <p className="mt-2 text-sm text-black/60 dark:text-white/70">
            Stealth addresses keep total earnings private while every donation stays verifiable on‑chain.
          </p>
        </div>
      </div>
    </section>
  );
}

// -------------------------------
// CTA
// -------------------------------
function CTA() {
  return (
    <section className="relative pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-black to-black/80 p-8 shadow-2xl sm:p-10 dark:from-white/10 dark:to-white/5">
          <div className="absolute inset-0 -z-10 opacity-30 blur-3xl" style={{ background: "radial-gradient(60% 60% at 50% 40%, #a78bfa, #22d3ee)" }} />
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h3 className="text-2xl font-semibold text-white">Start accepting crypto tips today</h3>
              <p className="mt-1 text-white/80">It takes less than a minute.</p>
            </div>
            <Link href="/dashboard" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow hover:opacity-90 dark:bg-white dark:text-black">Open App</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// -------------------------------
// Footer
// -------------------------------
function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-black/60 dark:text-white/70">
      <div className="flex items-center justify-between border-t border-white/10 pt-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-cyan-500" />
          <span>Stealth.Giving</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="#faq" className="hover:opacity-80">FAQ</Link>
          <Link href="#privacy" className="hover:opacity-80">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}

// -------------------------------
// Main Page
// -------------------------------
export default function LandingPage() {
  return (
    <div className="min-h-svh">
      <NavBar />
      <main className="pt-28">
        <Hero />
        <Showcase />
        <HowItWorks />
        <Privacy />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
