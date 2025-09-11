const NFTCard = ({
  name,
  collection,
  image,
  verified,
}: {
  name: string;
  collection: string;
  image: string;
  verified?: boolean;
}) => (
  <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
    <img
      src={image}
      alt={name}
      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
    />
    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
      <div className="flex items-center gap-2 text-xs">
        <span className="truncate font-medium">{name}</span>
        {verified && (
          <span
            title="Verified"
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-black text-[10px] font-bold"
          >
            ✓
          </span>
        )}
      </div>
      <div className="text-[11px] text-white/70 truncate">{collection}</div>
    </div>
  </div>
);

export default NFTCard;
