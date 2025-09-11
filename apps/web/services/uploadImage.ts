"use server";
// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function dataURItoBuffer(dataURI: string): Buffer {
  const base64 = dataURI.split(",")[1];
  return Buffer.from(base64, "base64");
}

type UploadKind = "avatar" | "banner" | "generic";

type UploadOpts = {
  folder?: string;
  publicId?: string;
  kind?: UploadKind;
  width?: number;
  height?: number;
};

export const uploadImage = async (
  dataURI: string | Buffer,
  opts: { kind?: "avatar" | "banner" | "generic"; folder?: string; publicId?: string } = {}
): Promise<string> => {
  const buffer = typeof dataURI === "string" ? dataURItoBuffer(dataURI) : dataURI;
  const { kind = "generic", folder = "uploads", publicId } = opts;

  let transformation: any[] = [];

  if (kind === "avatar") {
    // square, face-focused
    transformation = [
      { width: 512, height: 512, crop: "thumb", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ];
  } else if (kind === "banner") {
    // do NOT force square, just resize to max width, keep aspect ratio
    transformation = [
      { width: 1920, crop: "limit" }, // limit width, height auto
      { quality: "auto", fetch_format: "auto" },
    ];
  } else {
    // generic: limit dimensions, preserve aspect
    transformation = [
      { width: 1600, height: 1600, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ];
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        transformation,
      },
      (err, res) => (err ? reject(err) : resolve(res!.secure_url))
    );
    stream.end(buffer);
  });
};
