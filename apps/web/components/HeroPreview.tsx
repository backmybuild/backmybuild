import Link from "next/link";

export interface NFT {
  name: string;
  collection: string;
  image: string;
  verified?: boolean;
}

const HeroPreview = ({nfts}: {nfts: NFT[]}) => (
  <div className="relative">
    {/* glass card */}
    <div className="relative rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-2xl">
      <div className="grid grid-cols-3 gap-2">
        {nfts.slice(0, 9).map((n, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl aspect-square"
          >
            <img
              src={n.image}
              alt={n.name}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
    {/* floating CTA */}
    <Link
      href="/app"
      className="absolute -bottom-5 -right-5 rounded-2xl bg-white text-black px-5 py-3 font-semibold shadow-xl hover:translate-y-[-2px] active:translate-y-[0] transition"
    >
      Open App
    </Link>
  </div>
);

export default HeroPreview;
