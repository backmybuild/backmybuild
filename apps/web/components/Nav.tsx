"use client";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { motion } from "framer-motion";

const container = {
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
const item = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 500, damping: 28, duration: 0.35 },
  },
};

export default function NavBar() {
  return (
    <nav className="fixed left-1/2 top-6 z-40 -translate-x-1/2">
      {/* width wrapper: long on mobile, auto on sm+ */}
      <div className="mx-auto w-[92vw] max-w-[680px] sm:w-[90vw]">
        {/* glow follows width */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-white/60 blur-2xl dark:bg-white/10"
        />
        {/* glass pill */}
        <motion.div
          variants={{ ...container }}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-between gap-3 rounded-full border border-black/10 bg-white/70 px-3 py-2 shadow-2xl backdrop-blur-xl backdrop-saturate-150
                     dark:border-white/10 dark:bg-white/10 sm:gap-4 sm:px-4"
        >
          {/* left: brand */}
          <motion.div
            variants={item}
            className="flex min-w-0 items-center gap-2"
          >
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Stealth.Giving Logo"
                width={28}
                height={28}
                className="h-7 w-7"
                priority
              />
              <span className="truncate text-sm font-semibold tracking-wide sm:text-base">
                Stealth
              </span>
            </Link>
          </motion.div>

          {/* center/right: links (hidden on mobile) */}
          <motion.div
            variants={item}
            className="hidden items-center gap-4 text-sm sm:flex"
          >
            <motion.a variants={item} href="#how" className="hover:opacity-80">
              How it works
            </motion.a>
            <motion.a
              variants={item}
              href="#privacy"
              className="hover:opacity-80"
            >
              Privacy
            </motion.a>
            <motion.a variants={item} href="#faq" className="hover:opacity-80">
              FAQ
            </motion.a>
          </motion.div>

          {/* right: theme toggle */}
          <motion.div variants={item} className="shrink-0 gap-2 flex">
            <motion.div variants={item}>
              <Link
                href="/dashboard"
                className="text-sm inline-flex rounded-full border border-black/10 bg-white/80 h-9 px-3 py-1.5 font-semibold shadow-sm backdrop-blur-md transition hover:bg-white
                           dark:border-white/10 dark:bg-white/15 dark:hover:bg-white/20"
              >
                Open App
              </Link>
            </motion.div>
            <ThemeToggle />
          </motion.div>
        </motion.div>
      </div>
    </nav>
  );
}
