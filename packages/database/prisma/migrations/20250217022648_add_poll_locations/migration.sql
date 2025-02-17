/*
  Warnings:

  - You are about to drop the column `location` on the `polls` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "polls" DROP COLUMN "location";

-- CreateTable
CREATE TABLE "poll_locations" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "placeId" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "poll_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "poll_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "poll_locations_poll_id_idx" ON "poll_locations"("poll_id");

-- AddForeignKey
ALTER TABLE "poll_locations" ADD CONSTRAINT "poll_locations_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
