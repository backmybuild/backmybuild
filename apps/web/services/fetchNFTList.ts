import { Address } from "viem";
import { NFTByChain, NftItem } from "../types/nft";
import axios from "axios";

const MagicEdenSupportedChains = ["ethereum", "base", "polygon", "abstract", "apechain", "arbitrum", "berachain", "bsc"];

const fetchMagicEdenNFTs = async (
  chain: string,
  address: Address
): Promise<NftItem[]> => {
  try {
    const response = await axios.get(
      `https://api-mainnet.magiceden.dev/v3/rtp/${chain}/users/${address}/tokens/v7?normalizeRoyalties=false&sortBy=acquiredAt&sortDirection=desc&limit=100&includeTopBid=false&includeAttributes=false&includeLastSale=false&includeRawData=false&filterSpamTokens=true&useNonFlaggedFloorAsk=false`
    );
    const nfts: NftItem[] = response.data.tokens.map((nft: any) => ({
      id: Math.random().toString(36).substring(2, 15),
      tokenId: nft.token.tokenId,
      name: nft.token.name || "Untitled",
      collection: nft.token.collection.name || "Unknown Collection",
      image: nft.token.image || "https://via.placeholder.com/200",
      verified: !nft.isSpam,
    }));

    return nfts;
  } catch (error) {
    console.error("Error fetching Magic Eden NFTs:", chain, address, error);
    return [];
  }
};

const fetchVictionNFTs = async (address: Address): Promise<NftItem[]> => {
  try {
    const response = await axios.get(
      `https://assets.coin98.com/nfts/88/${address}`
    );
    const nfts: NftItem[] = response.data.reduce((acc: NftItem[], currentValue: any ) => {
      const nftsInCollection: NftItem[] = currentValue.data.map((nft: any) => ({
        id: Math.random().toString(36).substring(2, 15),
        tokenId: nft.id,
        name: nft.metaData.name || "Untitled",
        collection: currentValue.collection.name || "Unknown Collection",
        image: nft.metaData.image || "https://via.placeholder.com/200",
        verified: !nft.isVerified,
      }));

      acc.push(...nftsInCollection);
      return acc;
    }, []);

    return nfts;
  } catch (error) {
    console.error("Error fetching Viction NFTs:", address, error);
    return [];
  }
};

export const handleFetchMultiChainNFTs = async (
  address: Address
): Promise<NFTByChain[]> => {
  const nftList: NFTByChain[] = [];
  const victionNFTs = await fetchVictionNFTs(address);

  if (victionNFTs.length > 0) {
    nftList.push({
      chain: "viction",
      nfts: victionNFTs,
    });
  }

  for (const chain of MagicEdenSupportedChains) {
    const nfts = await fetchMagicEdenNFTs(chain, address);
    if (nfts.length > 0) {
      nftList.push({
        chain,
        nfts,
      });
    }
  }

  return nftList;
};
