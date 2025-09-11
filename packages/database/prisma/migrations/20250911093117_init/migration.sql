/*
  Warnings:

  - You are about to drop the column `fromAddress` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `stealthAddress` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `StealthAddress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[chain,txHash]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorizedAddress` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TxType" AS ENUM ('RECEIVE', 'WITHDRAW');

-- DropForeignKey
ALTER TABLE "public"."StealthAddress" DROP CONSTRAINT "StealthAddress_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_toUserId_fkey";

-- DropIndex
DROP INDEX "public"."Transaction_stealthAddress_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Transaction_toUserId_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Transaction_txHash_key";

-- AlterTable
ALTER TABLE "public"."Transaction" DROP COLUMN "fromAddress",
DROP COLUMN "stealthAddress",
DROP COLUMN "toUserId",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "authorizedAddress" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "public"."TxType" NOT NULL,
ALTER COLUMN "amountWei" SET DATA TYPE DECIMAL(78,0);

-- DropTable
DROP TABLE "public"."StealthAddress";

-- DropTable
DROP TABLE "public"."User";

-- CreateIndex
CREATE INDEX "Transaction_authorizedAddress_createdAt_idx" ON "public"."Transaction"("authorizedAddress", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Transaction_authorizedAddress_isActive_createdAt_idx" ON "public"."Transaction"("authorizedAddress", "isActive", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Transaction_authorizedAddress_address_isActive_idx" ON "public"."Transaction"("authorizedAddress", "address", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_chain_txHash_key" ON "public"."Transaction"("chain", "txHash");
