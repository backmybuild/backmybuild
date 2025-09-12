import crypto from "crypto";
import { totp } from "otplib";

// derive secret from userId/email + master key
function deriveSecret(userId: string, masterKey: string): string {
  return crypto.createHmac("sha256", masterKey).update(userId).digest("hex");
}

// configure totp
totp.options = {
  step: 60,   // valid for 60s (RFC-6238 default is 30s, you can choose)
  digits: 6,  // 6-digit code
};

// generate OTP for a user
export function generateOtp(userId: string, masterKey: string) {
  const secret = deriveSecret(userId, masterKey);
  return totp.generate(secret);
}

// verify OTP (allow for clock drift)
export function verifyOtp(userId: string, masterKey: string, token: string) {
  const secret = deriveSecret(userId, masterKey);
  return totp.check(token, secret);
}

const test = async () => {
  const userId = "test"
  const master = "supersecretmasterkey"
  
  const otp = generateOtp(userId, master);
  console.log("Generated OTP:", otp);
  const isValid = verifyOtp(userId, master, otp);
  console.log("Is OTP valid?", isValid);
}

test()