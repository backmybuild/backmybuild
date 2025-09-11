import { Address } from "viem";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface IAuthorizedAccountStoreState {
  loading: boolean;
  authorizedAddress: Address | null;
  onUpdateAddress: (address: Address | null) => void;
}

export const useAuthorizedAccount = create<IAuthorizedAccountStoreState>()(
  persist(
    (set) => ({
      loading: true,
      authorizedAddress: null,
      onUpdateAddress: (address: Address | null) =>
        set((_: any) => ({
          authorizedAddress: address
        })),
    }),
    {
      name: "authorized-address", // unique name
      version: 1,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (_: IAuthorizedAccountStoreState) => {
        return (state: IAuthorizedAccountStoreState | undefined, error: unknown) => {
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