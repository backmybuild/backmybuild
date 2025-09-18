import {
  createPublicClient,
  http,
  parseAbiItem,
  type Chain,
  type PublicClient,
} from "viem";
import { ANNOUNCER_ADDRESS, ANNOUNCER_EVENT, SUPPORT_CHAINS } from "@stealthgiving/definition";
import prisma from "@stealthgiving/database";

const BLOCK_BATCH_SIZE = 20n;
const AUTHORIZED_BATCH_SIZE = 50n;

// prdefine clients
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const processRange = async (
  client: PublicClient,
  fromBlock: bigint,
  blockNumber: bigint
) => {
  const announcementEvents = await client.getLogs({
    fromBlock: fromBlock,
    toBlock: blockNumber,
    address: ANNOUNCER_ADDRESS,
    event: ANNOUNCER_EVENT,
  });

  for (const event of announcementEvents) {
    // #TODO: process events
  }
};

const main = async () => {
  console.log("Starting crawler...");
  const syncStatuses = new Map<string, bigint>();

  for (const chain of SUPPORT_CHAINS) {
    const status = await prisma.syncStatus.findUnique({
      where: { chainName: chain.name },
    });
    if (status) {
      syncStatuses.set(chain.name, BigInt(status.blockNum));
    } else {
      const client = createPublicClient({
        chain: chain,
        transport: http(),
      });
      const currentBlock = await client.getBlockNumber();
      await prisma.syncStatus.create({
        data: { chainName: chain.name, blockNum: currentBlock.toString() },
      });
      syncStatuses.set(chain.name, currentBlock);
    }
  }

  while (true) {
    for (const chain of SUPPORT_CHAINS) {
      try {
        console.log(`Crawling chain: ${chain.name}`);
        const client: PublicClient = createPublicClient({
          chain: chain,
          transport: http(),
        }) as PublicClient;
        const currentBlock = await client.getBlockNumber();
        const lastSyncedBlock = syncStatuses.get(chain.name)!;

        if (lastSyncedBlock === undefined) {
          throw new Error("Last synced block is undefined");
        }

        if (currentBlock <= lastSyncedBlock) continue;
        const targetBlock =
          currentBlock > lastSyncedBlock + BLOCK_BATCH_SIZE
            ? lastSyncedBlock + BLOCK_BATCH_SIZE
            : currentBlock;
        await processRange(client, lastSyncedBlock + 1n, targetBlock);
        await prisma.syncStatus.upsert({
          where: { chainName: chain.name },
          update: { blockNum: targetBlock.toString() },
          create: { chainName: chain.name, blockNum: targetBlock.toString() },
        });
        syncStatuses.set(chain.name, targetBlock);
      } catch (e) {
        console.error(`Error crawling chain ${chain.name}:`, e);
      }
      await sleep(1000); // Sleep between chains to avoid rate limits
    }
    console.log(
      "Completed one full crawl cycle. Sleeping before next cycle..."
    );
    await sleep(60000); // Sleep for 1 minute before next full cycle
  }
};

main();
