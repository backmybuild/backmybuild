"use server";
import { Metadata, ResolvingMetadata } from "next";
import DonationInfo from "./info";
import { CHAIN, publicClient } from "@fuelme/defination";
import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { Hex, hexToString, stringToHex } from "viem";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const generateMetadata = async (
  { params }: Props,
  _: ResolvingMetadata
): Promise<Metadata> => {
  // read route params
  const { username } = await params;
  const profileEncoded = await publicClient.readContract({
    address: FUELME_ADDRESSES[CHAIN.id],
    abi: FUELME_ABI,
    functionName: "getProfile",
    args: [stringToHex(username)],
  });
  const profileData = profileEncoded
    ? ((profileEncoded as any)[1] as Hex)
    : null;

  if (profileData == "0x" || !profileData) {
    return {
      title: "Stealth Giving",
      description: "A better way to give crypto to anyone, anywhere.",
      icons: {
        icon: "/logo.svg",
      },
    };
  }

  const profileDecoded = hexToString(profileData);
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
};

const DonationPage = async () => {
  return <DonationInfo />;
};

export default DonationPage;
