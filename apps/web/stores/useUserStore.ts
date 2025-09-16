import { Address, Hex } from "viem";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Transaction = {
  blockNumber: string;
  blockTimestamp: string;
  txHash: Hex;
  from: string;
  message?: string;
  amount: string;
  supporterName?: string; // e.g. "Anonymous", "Linh"
  avatarUrl?: string; // optional
};

export type StealthAddress = {
  address: Address;
  ephemeralPublicKey: string;
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
  sync: (blockNum: string, transactions: Transaction[], addresses: StealthAddress[]) => void;
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
      sync: (blockNum: string, transactions: Transaction[], addresses: StealthAddress[]) =>
        set((state: IUserStoreState) => {
          if (!state.user) return state;
          if (transactions.length === 0 && addresses.length === 0 && state.user.syncToBlock === blockNum) return state;
          if (!state.user.transactions) state.user.transactions = [];
          if (!state.user.stealthAddresses) state.user.stealthAddresses = [];

          const newTransactions = [...state.user.transactions, ...transactions];
          newTransactions.sort((a, b) => (a.blockNumber < b.blockNumber ? 1 : -1));
          const uniqueTxs = newTransactions.filter(
            (tx, index, self) => index === self.findIndex((t) => t.txHash === tx.txHash)
          );

          const newStealthAddresses = [...state.user.stealthAddresses, ...addresses];
          const uniqueAddrs = newStealthAddresses.filter(
            (addr, index, self) => index === self.findIndex((a) => a.address === addr.address)
          );

          return {
            ...state,
            user: {
              ...state.user,
              syncToBlock: blockNum,
              transactions: uniqueTxs,
              stealthAddresses: uniqueAddrs,
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
