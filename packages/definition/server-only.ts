import { createWalletClient, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import nodemailer from "nodemailer";

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex || generatePrivateKey();
const ACCOUNT_SEEDS = process.env.ACCOUNT_SEEDS || "HELLO_FUELME";
const OPT_SEEDS = process.env.OPT_SEEDS || "OPT_FUELME";

const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,            // SSL
  secure: true,         // true for 465
  auth: {
    user: process.env.GMAIL_USER!,      // your full Gmail address
    pass: process.env.GMAIL_APP_PASS!,  // 16-char app password
  },
  pool: true,           // optional: connection pooling
});

export {
  PRIVATE_KEY,
  ACCOUNT_SEEDS,
  OPT_SEEDS,
  mailer
}