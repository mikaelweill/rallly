-- AlterTable
ALTER TABLE "events" ADD COLUMN     "location_id" TEXT;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "poll_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
