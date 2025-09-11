import { createPublicClient, hexToString, http, parseAbiItem, stringToHex, toHex, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import prisma from "@fuelme/database";
import { CHAIN, publicClient, USDC_ADDRESS } from "@fuelme/defination";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { checkStealthAddress, computeViewingKey } from "@fuelme/stealth";
import { ACCOUNT_SEEDS } from "@fuelme/defination/server";

const BLOCK_BATCH_SIZE = 20n;
const AUTHORIZED_BATCH_SIZE = 50n;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const processAnnouncementEvents = async (events: any[]) => {
  for (const event of events) {
    const { stealthAddress, viewTag, ephemeralPublicKey, amount, message } =
      event.args;
    console.log({
      stealthAddress,
      viewTag,
      ephemeralPublicKey,
      amount: amount.toString(),
      message,
    });
    const totalAddresses = await publicClient.readContract({
      abi: FUELME_ABI,
      address: FUELME_ADDRESSES[CHAIN.id],
      functionName: "getAuthorizersCount",
    });
    for (let i = 0n; i < Number(totalAddresses); i += AUTHORIZED_BATCH_SIZE) {
      const [authorizeAddresses, keys] = (await publicClient.readContract({
        abi: FUELME_ABI,
        address: FUELME_ADDRESSES[CHAIN.id],
        functionName: "getAuthorizers",
        args: [i, AUTHORIZED_BATCH_SIZE],
      })) as [any, any];

      for (const [index, address] of authorizeAddresses.entries()) {
        const keyDecoded = hexToString(keys[index]).split("|");
        const viewingKey = computeViewingKey(
          stringToHex(ACCOUNT_SEEDS),
          address
        );
        const isOwnerOfStealthAddress = checkStealthAddress(
          stealthAddress,
          ephemeralPublicKey,
          keyDecoded[0] as Hex, // spendingPublicKey
          viewingKey.privateKey, // viewingPrivateKey
          toHex(viewTag)
        );

        if (isOwnerOfStealthAddress) {
          console.log("Found owner:", { address, keyDecoded });
        }
      }

      // const isOwnerOfStealthAddress = checkStealthAddress(
      //   stealthAddress,
      //   ephemeralPublicKey,
      //   authorizers[0], // spendingPublicKey
      //   authorizers[1] // viewingPrivateKey
      // );
    }
  }
};

const processRange = async (fromBlock: bigint, blockNumber: bigint) => {
  const usdcTransferEvents = await publicClient.getLogs({
    fromBlock: fromBlock,
    toBlock: blockNumber,
    address: USDC_ADDRESS,
    event: parseAbiItem("event Transfer(address,address,uint256)"),
  });

  const announcementEvents = await publicClient.getLogs({
    fromBlock: fromBlock,
    toBlock: blockNumber,
    address: FUELME_ADDRESSES[CHAIN.id],
    event: parseAbiItem(
      "event Announcement(address indexed stealthAddress,uint16 indexed viewTag,bytes ephemeralPublicKey,uint256 amount,bytes message)"
    ),
  });
  await processAnnouncementEvents(announcementEvents);
  // await processEvents(events);
};

const main = async () => {
  console.log("Starting crawler...");
  await processRange(30906743n , 30906743n);
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
  //     await sleep(2000); // Wait for 2 seconds before the next fetch
  //   } catch (e) {
  //     console.error(e);
  //     await sleep(2000);
  //   }
  // }
};

main();
