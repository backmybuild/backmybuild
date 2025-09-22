import Link from "next/link";
import Logo from "./Logo";

const Footer: React.FC = () => {
  return (
    <footer className="mt-8 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/60">
        <div className="flex items-center gap-2">
          <img src="/back.png" alt="Back Logo" className="h-7 w-15" />
          <span className="font-semibold tracking-wide">my Build</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#privacy" className="hover:opacity-90">
            Privacy
          </a>
          <a href="#faq" className="hover:opacity-90">
            FAQ
          </a>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/10"
          >
            Get started
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
