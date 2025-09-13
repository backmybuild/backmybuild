"use client";

import Link from "next/link";
import Logo from "./Logo";

type NavProps = {
  children: React.ReactNode;
};

const Nav: React.FC<NavProps> = ({ children }: { children: React.ReactNode }) => {
  return (
    <nav className="sticky top-0 z-30 bg-black/50 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold tracking-wide">Stealth.Giving</span>
        </Link>
        {children}
      </div>
    </nav>
  );
};


export default Nav;