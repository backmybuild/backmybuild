import { Address, Hex } from "viem";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Transaction = {
  blockNumber: string;
  blockTimestamp: string;
  txHash: Hex;
  from: string;
  to: string;
  message: string;
};

type StealthAddress = {
  address: Address;
  ephemeralPublicKey: string;
  balance: string;
};

export interface IUser {
  syncToBlock: string;
  viewingPrivateKey: string;
  spendingPublicKey: string;
  transactions: Transaction[];
  stealthAddresses: StealthAddress[];
}

interface IUserStoreState {
  user: IUser | null;
  loading: boolean;
  initProfile: (viewingPrivateKey: string, spendingPublicKey: string, createdBlock: string) => void;
  setSyncToBlock: (blockNum: string) => void;
  addTransaction: (tx: Transaction) => void;
  addStealthAddress: (address: StealthAddress) => void;
  removeStealthAddress: (address: Address) => void;
}

export const useUserStore = create<IUserStoreState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      initProfile: (viewingPrivateKey: string, spendingPublicKey: string, createdBlock: string) =>
        set((state: IUserStoreState) => ({
          ...state,
          user: {
            syncToBlock: createdBlock,
            viewingPrivateKey,
            spendingPublicKey,
            transactions: [],
            stealthAddresses: [],
          },
        })),
      setSyncToBlock: (blockNum: string) =>
        set((state: IUserStoreState) => {
          if (!state.user) return state;
          return {
            ...state,
            user: {
              ...state.user,
              syncToBlock: blockNum,
            },
          };
        }),
      addTransaction: (tx: Transaction) =>
        set((state: IUserStoreState) => {
          if (!state.user) return state;
          if (!state.user.transactions) state.user.transactions = [];
          const exists = state.user.transactions.find(
            (t) => t.txHash === tx.txHash
          );
          if (exists) return state;
          const transactions = [tx, ...state.user.transactions];
          return {
            ...state,
            user: {
              ...state.user,
              transactions,
            },
          };
        }),
      addStealthAddress: (address: StealthAddress) =>
        set((state: IUserStoreState) => {
          if (!state.user) return state;
          if (!state.user.stealthAddresses) state.user.stealthAddresses = [];
          const exists = state.user.stealthAddresses.find(
            (a) => a.address === address.address
          );
          if (exists) return state;
          return {
            ...state,
            user: {
              ...state.user,
              stealthAddresses: [address, ...state.user.stealthAddresses],
            },
          };
        }),
      removeStealthAddress: (address: Address) =>
        set((state: IUserStoreState) => {
          if (!state.user) return state;
          const stealthAddresses = state.user.stealthAddresses.filter(
            (a) => a.address !== address
          );
          return {
            ...state,
            user: {
              ...state.user,
              stealthAddresses,
            },
          };
        }),
    }),
    {
      name: "user-storage", // name of the item in the storage (must be unique)
      version: 1,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (_: IUserStoreState) => {
        return (state: IUserStoreState | undefined, error: unknown) => {
          if (error) {
            console.log(state);
            console.error("Failed to rehydrate state", error);
          }

          if (state) {
            state.loading = false;
          }
        };
      },
    }
  )
);
