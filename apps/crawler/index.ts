import {
  erc20Abi,
  hexToString,
  parseAbiItem,
  stringToHex,
  toHex,
  type Hex,
} from "viem";
import prisma from "@fuelme/database";
import { CHAIN, publicClient, USDC_ADDRESS } from "@fuelme/defination";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { checkStealthAddress, computeViewingKey } from "@fuelme/stealth";
import { ACCOUNT_SEEDS } from "@fuelme/defination/server";

const BLOCK_BATCH_SIZE = 20n;
const AUTHORIZED_BATCH_SIZE = 50n;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const processAnnouncementEvent = async (event: any) => {
  const { stealthAddress, viewTag, ephemeralPublicKey, amount, message } =
    event.args;
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
      console.log(stealthAddress, viewTag, ephemeralPublicKey, amount, message);
      const viewingKey = computeViewingKey(stringToHex(ACCOUNT_SEEDS), address);
      const isOwnerOfStealthAddress = checkStealthAddress(
        stealthAddress,
        ephemeralPublicKey,
        keyDecoded[0] as Hex, // spendingPublicKey
        viewingKey.privateKey, // viewingPrivateKey
        toHex(viewTag)
      );

      console.log(isOwnerOfStealthAddress)

      if (isOwnerOfStealthAddress) {
        const balance = await publicClient.readContract({
          abi: erc20Abi,
          address: USDC_ADDRESS,
          functionName: "balanceOf",
          args: [stealthAddress],
        });

        await prisma.transaction.create({
          data: {
            type: "RECEIVE",
            authorizedAddress: address,
            address: stealthAddress,
            ephemeralPublicKey: ephemeralPublicKey,
            amountWei: balance.toString(),
            txHash: event.transactionHash,
            message: hexToString(message) || "",
            chain: CHAIN.id.toString(),
          },
        });
        return;
      }
    }
  }
};

const processAnnouncementEvents = async (events: any[]) => {
  for (const event of events) {
    await processAnnouncementEvent(event);
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
  await processRange(30909003n, 30909003n);
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
