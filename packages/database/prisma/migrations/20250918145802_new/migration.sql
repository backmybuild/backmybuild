/*
  Warnings:

  - You are about to drop the column `SyncToBlock` on the `SyncStatus` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[blockNum]` on the table `SyncStatus` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `blockNum` to the `SyncStatus` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."SyncStatus_SyncToBlock_key";

-- AlterTable
ALTER TABLE "public"."SyncStatus" DROP COLUMN "SyncToBlock",
ADD COLUMN     "blockNum" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SyncStatus_blockNum_key" ON "public"."SyncStatus"("blockNum");
