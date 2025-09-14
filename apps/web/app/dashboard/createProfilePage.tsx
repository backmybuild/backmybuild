import { FUELME_ABI, FUELME_ADDRESSES } from "@fuelme/contracts";
import { CHAIN, publicClient } from "@fuelme/defination";
import { useState } from "react";
import { Address, stringToHex, zeroAddress } from "viem";

type Props = {
  onProfileCreated: (username: string) => Promise<void>;
};

const CreateProfilePage: React.FC<Props> = ({ onProfileCreated }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProfile = async () => {
    setIsCreating(true);
    const trimmedUsername = username.trim().toLocaleLowerCase();
    const exitedAddress = await publicClient.readContract({
      address: FUELME_ADDRESSES[CHAIN.id] as Address,
      abi: FUELME_ABI,
      functionName: "addressOfUsername",
      args: [stringToHex(trimmedUsername)],
    });

    if (exitedAddress !== zeroAddress) {
      setError("Username already taken. Please choose another one.");
    } else {
      onProfileCreated(username)
    }

    setIsCreating(false);
  };

  return (
    <div className="min-h-screen justify-center text-white">
      <h1 className="text-4xl font-bold mb-6">Create Your Profile</h1>
      <p className="mb-4 text-center px-4">
        It looks like you don't have a profile yet. Click the button below to
        create one and get started!
      </p>

      <input
        type="text"
        placeholder="Enter your handle"
        value={username}
        onChange={(e) => {
          setError(null)
            setUsername(e.target.value.replace(/[^\w]/gi, ''))
        }}
        className="mb-4 px-4 py-2 mr-2 border border-gray-600 rounded-md bg-black text-white w-full max-w-sm"
      />
      <button
        onClick={handleCreateProfile}
        disabled={isCreating || username.trim() === "" || error !== null}
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold disabled:opacity-50 w-full max-w-sm"
      >
        {isCreating ? "Creating..." : "Create Profile"}
      </button>
      {error && <p className="text-xs text-amber-400">{error}</p>}
    </div>
  );
};

export default CreateProfilePage;
