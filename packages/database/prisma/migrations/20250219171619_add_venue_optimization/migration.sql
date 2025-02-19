-- AlterTable
ALTER TABLE "polls" ADD COLUMN     "is_location_optimized" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "venue_preferences" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "venue_type" TEXT NOT NULL,
    "sub_type" TEXT,
    "min_rating" DOUBLE PRECISION,
    "price_level" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_start_locations" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "transport_mode" TEXT NOT NULL DEFAULT 'driving',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_start_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venue_preferences_poll_id_key" ON "venue_preferences"("poll_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_start_locations_participant_id_key" ON "participant_start_locations"("participant_id");

-- AddForeignKey
ALTER TABLE "venue_preferences" ADD CONSTRAINT "venue_preferences_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_start_locations" ADD CONSTRAINT "participant_start_locations_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
