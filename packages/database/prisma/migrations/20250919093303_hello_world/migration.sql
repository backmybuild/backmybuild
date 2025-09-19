/*
  Warnings:

  - A unique constraint covering the columns `[address]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[txHash]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transaction_address_key" ON "public"."Transaction"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "public"."Transaction"("txHash");
