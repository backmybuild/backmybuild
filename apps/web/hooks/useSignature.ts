import { Hex } from 'viem';
import { create } from 'zustand';

interface SignatureState {
  signature: Hex | null;
  setSignature: (signature: Hex | null) => void;
}

const useSignatureStore = create<SignatureState>((set, get) => ({
  signature: null,
  setSignature: (signature: Hex | null) => set({ signature }),
}));

export default useSignatureStore;