export type Profile = {
  username: string;
  fullname?: string;
  bio?: string;
  avatarUrl?: string;
  socials?: string[];
  createAtBlock: bigint;
};

export type ProfileStore = {
  profile: Profile | null;
  isLoading: boolean;
};