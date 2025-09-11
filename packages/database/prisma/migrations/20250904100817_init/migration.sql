-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "socialLinks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StealthAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ephemeralPublicKey" TEXT NOT NULL,
    "balanceWei" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StealthAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "fromAddress" TEXT,
    "toUserId" TEXT NOT NULL,
    "stealthAddress" TEXT NOT NULL,
    "amountWei" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "message" TEXT,
    "chain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "public"."User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "StealthAddress_address_key" ON "public"."StealthAddress"("address");

-- CreateIndex
CREATE INDEX "StealthAddress_userId_idx" ON "public"."StealthAddress"("userId");

-- CreateIndex
CREATE INDEX "StealthAddress_userId_updatedAt_idx" ON "public"."StealthAddress"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "public"."Transaction"("txHash");

-- CreateIndex
CREATE INDEX "Transaction_toUserId_createdAt_idx" ON "public"."Transaction"("toUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_stealthAddress_createdAt_idx" ON "public"."Transaction"("stealthAddress", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."StealthAddress" ADD CONSTRAINT "StealthAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
