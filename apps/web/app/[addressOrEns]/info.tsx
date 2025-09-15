"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { FUELME_ABI, FUELME_ADDRESSES } from "@stealthgiving/contracts";
import { CHAIN, publicClient } from "@stealthgiving/definition";
import { NextPage } from "next";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Hex, hexToString } from "viem";
import DonateForm, { Key } from "./form";
import SocialIcon from "../../components/SocialIcon";

export type Profile = {
  fullname?: string;
  bio?: string;
  avatarUrl?: string;
  socials?: string[];
  key: Key;
};

const DonationInfo: NextPage = () => {
  const params = useParams();
  const addressOrEns = params.addressOrEns as string;
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const [keyEncoded, profileEncoded, createAt] =
        (await publicClient.readContract({
          address: FUELME_ADDRESSES[CHAIN.id],
          abi: FUELME_ABI,
          functionName: "profilesOfAddress",
          args: [addressOrEns],
        })) as [Hex, Hex, bigint];
      if (
        profileEncoded == "0x" ||
        keyEncoded == "0x" ||
        !profileEncoded ||
        !keyEncoded
      ) {
        setIsLoading(false);
        return;
      } else {
        const profileDecoded = hexToString(profileEncoded);
        const profileArray = profileDecoded.split("|");

        const keyDecoded = hexToString(keyEncoded);
        const keyArray = keyDecoded.split("|");

        setProfile({
          fullname: profileArray[0] || "",
          avatarUrl: profileArray[1] || "",
          bio: profileArray[2] || "",
          socials: profileArray[3] ? profileArray[3].split(",") : [],
          key: {
            spendingPublicKey: keyArray[0] as Hex,
            viewingPublicKey: keyArray[1] as Hex,
            encryptionPublicKey: keyArray[2] as string,
          },
        });
        setIsLoading(false);
      }
    };
    if (addressOrEns) {
      fetchProfile();
    }
  }, [addressOrEns]);

  if (isLoading) {
    return (
      <main className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-black text-white flex items-center justify-center">
        <div className="text-white/70">Loading profile...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-black text-white flex items-center justify-center">
        <div className="text-white/70">Profile not found.</div>
        <Link className="ml-2 text-white/70" href="/">
          Go back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="h-svh bg-black text-white grid place-items-center transition-opacity duration-300">
      <div className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg px-4 h-full flex items-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-xl text-center flex flex-col justify-center overflow-y-auto">
          <div className="flex flex-col items-center gap-5">
            <img
              src={profile.avatarUrl || "/avatar.png"}
              alt={`${profile.fullname} avatar`}
              width={128}
              height={128}
              className="h-32 w-32 rounded-3xl object-cover ring-1 ring-white/20"
            />
            <div>
              <h1 className="text-2xl font-semibold">{profile.fullname}</h1>
              <p className="text-base text-white/70 mt-2">{profile.bio}</p>
            </div>
          </div>

          <div className="mt-5 flex justify-center flex-wrap gap-4">
            {profile.socials?.map((s, i) => (
              <a
                key={i}
                href={s}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
              >
                <SocialIcon url={s} className="w-6 h-6" />
              </a>
            ))}
          </div>

          <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <DonateForm
            fullname={profile.fullname || ""}
            stealthKey={profile.key}
          />
        </section>
      </div>
    </main>
  );
};

export default DonationInfo;
