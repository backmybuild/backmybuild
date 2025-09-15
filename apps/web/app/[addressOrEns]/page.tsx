"use server";
import { Metadata, ResolvingMetadata } from "next";
import DonationInfo from "./info";
import { CHAIN, publicClient } from "@stealthgiving/definition";
import { FUELME_ABI, FUELME_ADDRESSES } from "@stealthgiving/contracts";
import { Hex, hexToString, isAddress, stringToHex } from "viem";

type Props = {
  params: Promise<{ addressOrEns: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const generateMetadata = async (
  { params }: Props,
  _: ResolvingMetadata
): Promise<Metadata> => {
  // read route params
  try {
    const { addressOrEns } = await params;
    if (!addressOrEns || !isAddress(addressOrEns)) {
      return {
        title: "Stealth Giving",
        description: "A better way to give crypto to anyone, anywhere.",
        icons: {
          icon: "/logo.svg",
        },
      };
    }
    const [keyEncoded, profileEncoded, createAt] =
      (await publicClient.readContract({
        address: FUELME_ADDRESSES[CHAIN.id],
        abi: FUELME_ABI,
        functionName: "profilesOfAddress",
        args: [addressOrEns],
      })) as [Hex, Hex, bigint];
    if (profileEncoded == "0x" || !profileEncoded) {
      return {
        title: "Stealth Giving",
        description: "A better way to give crypto to anyone, anywhere.",
        icons: {
          icon: "/logo.svg",
        },
      };
    }

    const profileDecoded = hexToString(profileEncoded);
    const profileArray = profileDecoded.split("|");

    return {
      title: profileArray[0] || "",
      description: profileArray[3] || "",
      icons: {
        icon: {
          url: profileArray[1] || "./logo.svg",
        },
      },
      openGraph: {
        images: [profileArray[1] || "./logo.svg"],
      },
    };
  } catch (e) {
    return {
      title: "Stealth Giving",
      description: "A better way to give crypto to anyone, anywhere.",
      icons: {
        icon: "/logo.svg",
      },
    };
  }
};

const DonationPage = async () => {
  return <DonationInfo />;
};

export default DonationPage;
