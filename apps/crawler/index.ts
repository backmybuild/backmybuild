import {
  createPublicClient,
  http,
  parseAbiItem,
  type PublicClient,
} from "viem";
import { ANNOUNCER_ADDRESS, publicClient, SUPPORT_CHAINS } from "@stealthgiving/definition";
import prisma from "@stealthgiving/database";

const BLOCK_BATCH_SIZE = 20n;
const AUTHORIZED_BATCH_SIZE = 50n;

// prdefine clients
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const processRange = async (client: PublicClient, fromBlock: bigint, blockNumber: bigint) => {
  const announcementEvents = await publicClient.getLogs({
    fromBlock: fromBlock,
    toBlock: blockNumber,
    address: ANNOUNCER_ADDRESS,
    event: parseAbiItem(
      "event Announcement(address indexed stealthAddress,uint16 indexed viewTag,bytes ephemeralPublicKey,uint256 amount,bytes message)"
    ),
  });
};

const main = async () => {
  console.log("Starting crawler...");
  
  while (true) {
    for (const chain of SUPPORT_CHAINS) {
      try {
        console.log(`Crawling chain: ${chain.name}`);
        const client = createPublicClient({
          chain: chain,
          transport: http(),
        });
        const currentBlock = await client.getBlockNumber();
        console.log(`Current block number: ${currentBlock}`);
      } catch (e) {
        console.error(`Error crawling chain ${chain.name}:`, e);
      }
      await sleep(2000); // Sleep between chains to avoid rate limits
    }
    console.log("Completed one full crawl cycle. Sleeping before next cycle...");
    await sleep(60000); // Sleep for 1 minute before next full cycle
  }

  // await processRange(30918328n, 30918527n);
  // let startBlock = await publicClient.getBlockNumber();
  // while (true) {
  //   try {
  //     const currentBlock = await publicClient.getBlockNumber();
  //     if (currentBlock > startBlock) {
  //       const targetBlock =
  //         currentBlock > startBlock + BLOCK_BATCH_SIZE
  //           ? startBlock + BLOCK_BATCH_SIZE
  //           : currentBlock;
  //       await processRange(startBlock + 1n, targetBlock);
  //       startBlock = targetBlock;
  //     }
  //     await sleep(2000);
  //   } catch (e) {
  //     console.error(e);
  //     await sleep(2000);
  //   }
  // }
};

main();
