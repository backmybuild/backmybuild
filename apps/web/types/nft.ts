export type NftItem = {
  id: string;
  tokenId: string;
  name: string;
  collection: string;
  image: string;
  verified?: boolean;
};


export type NFTByChain = {
  chain: string;
  nfts: NftItem[];
}