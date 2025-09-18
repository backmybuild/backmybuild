-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ephemeralPublicKey" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "message" TEXT,
    "chain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SyncStatus" (
    "id" TEXT NOT NULL,
    "chainName" TEXT NOT NULL,
    "SyncToBlock" TEXT NOT NULL,

    CONSTRAINT "SyncStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_address_createdAt_idx" ON "public"."Transaction"("address", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SyncStatus_chainName_key" ON "public"."SyncStatus"("chainName");

-- CreateIndex
CREATE UNIQUE INDEX "SyncStatus_SyncToBlock_key" ON "public"."SyncStatus"("SyncToBlock");
