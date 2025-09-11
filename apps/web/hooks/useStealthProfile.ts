import { Address } from "viem";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface IStealthProfile {
  profile: string;
  key: string
}

interface IStealthProfileStoreState {
  loading: boolean;
  stealthProfile: IStealthProfile | null;
  onUpdateProfile: (profile: string) => void;
  onUpdateKey: (key: string) => void;
}

export const useStealthProfile = create<IStealthProfileStoreState>()(
  persist(
    (set) => ({
      loading: true,
      stealthProfile: null,
      onUpdateProfile: (profile: string) =>
        set((state: any) => ({
          stealthProfile: {
            ...state.stealthProfile!,
            profile,
          },
        })),
      onUpdateKey: (key: string) =>
        set((state: any) => ({
          stealthProfile: {
            ...state.stealthProfile!,
            key,
          },
        })),
    }),
    {
      name: "stealth-profile-storage", // unique name
      version: 1,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (_: IStealthProfileStoreState) => {
        return (state: IStealthProfileStoreState | undefined, error: unknown) => {
          if (error) {
            console.log(state)
            console.error("Failed to rehydrate state", error);
          } 

          if (state) {
            state.loading = false
          }
        }
      },
    }
  )
);