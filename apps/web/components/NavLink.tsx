import Link from "next/link";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-sm text-white/80 hover:text-white transition">
    {children}
  </Link>
);

export default NavLink;