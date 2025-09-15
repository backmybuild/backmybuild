import { useRef, useState } from "react";
import { uploadImage } from "../../services/uploadImage";

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
};

type Props = {
  isAccountCreated: boolean;
  profile?: {
    avatarUrl: string;
    fullname: string;
    bio: string;
    socials: string[];
  };
  onClose: () => void;
  updateProfile: (
    fullname: string,
    avatarUrl: string,
    bio: string,
    socials: string[]
  ) => Promise<void>;
};

const UpdateProfileModal: React.FC<Props> = ({
  isAccountCreated,
  updateProfile,
  onClose,
  profile,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<{
    avatarUrl: string;
    fullname?: string;
    bio?: string;
    socials?: string[];
  }>(
    profile || {
      avatarUrl: "https://www.gravatar.com/avatar/?d=identicon",
    }
  );
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async () => {
    setSaving(true);
    let avatarUpload: string = form.avatarUrl;
    if (form.avatarUrl.startsWith("data:")) {
      avatarUpload = await uploadImage(avatarUpload, {
        kind: "avatar",
      });
    }
    await updateProfile(
      form.fullname ?? "",
      avatarUpload,
      form.bio ?? "",
      form.socials?.filter((s) => s.trim() !== "") ?? []
    );
    setSaving(false);
    onClose();
  };

  return (
    <div className="bg-[#000000] p-6 w-11/12 max-w-lg mx-auto rounded-xl">
      <h2 className="text-xl font-bold mb-4">
        {isAccountCreated ? "Update Profile" : "Create Profile"}
      </h2>
      <div className="grid gap-3">
        <span className="text-xs text-white/70">Avatar</span>
        <div
          className="relative h-40 w-40 aspect-square rounded-xl overflow-hidden ring-2 ring-white/10 group cursor-pointer"
          onClick={() => avatarInputRef.current?.click()}
          title="Click to change avatar"
        >
          <img
            src={form.avatarUrl}
            alt={"avatar"}
            className="h-40 w-40 aspect-square object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/15 transition-colors" />
          <input
            ref={avatarInputRef}
            id="avatar-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const dataUrl = await fileToDataUrl(f);
              setForm((s) => ({ ...s, avatarUrl: dataUrl }));
            }}
          />
        </div>
      </div>
      <label className="block mt-5">
        <div className="mb-1 text-sm text-white/70">Display name</div>
        <input
          placeholder="John Doe"
          value={form.fullname ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, fullname: e.target.value }))}
          className={`w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-white/20`}
        />
      </label>

      <label className="block mt-5">
        <div className="mb-1 text-sm text-white/70">Bio</div>
        <textarea
          placeholder="Say something about you…"
          value={form.bio ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          className={`w-full min-h-[92px] rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20`}
        />
      </label>

      {/* Social links editor */}
      <div className="space-y-2 mt-5">
        <div className="text-sm text-white/70">Social links</div>
        {(form.socials ?? []).map((s, idx) => (
          <div key={idx} className="grid grid-cols-[5fr_1fr_auto] gap-2">
            <label className="block">
              <input
                placeholder="https://…"
                value={s}
                onChange={(e) => {
                  const arr = [...(form.socials ?? [])];
                  arr[idx] = e.target.value;
                  setForm((f) => ({ ...f, socials: arr }));
                }}
                className={`w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-white/20`}
              />
            </label>
            <button
              className="rounded-xl bg-white/5 border border-white/10 px-3 text-sm hover:bg-white/10"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  socials: (f.socials ?? []).filter((_, i) => i !== idx),
                }))
              }
            >
              x
            </button>
          </div>
        ))}
        <button
          className="rounded-xl bg-white/5 border border-white/10 px-3 h-9 text-sm hover:bg-white/10"
          onClick={() =>
            setForm((f) => ({
              ...f,
              socials: [...(f.socials ?? []), ""],
            }))
          }
        >
          + Add social link
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          className={`h-10 px-4 hover:cursor-pointer rounded-xl bg-white text-black font-medium hover:bg-white/90 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={saving}
          onClick={handleUpdateProfile}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
};

export default UpdateProfileModal;
