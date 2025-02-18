-- CreateTable
CREATE TABLE "location_votes" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "type" "vote_type" NOT NULL DEFAULT 'yes',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "location_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_votes_poll_id_idx" ON "location_votes" USING HASH ("poll_id");

-- CreateIndex
CREATE INDEX "location_votes_participant_id_idx" ON "location_votes" USING HASH ("participant_id");

-- CreateIndex
CREATE INDEX "location_votes_location_id_idx" ON "location_votes" USING HASH ("location_id");

-- AddForeignKey
ALTER TABLE "location_votes" ADD CONSTRAINT "location_votes_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_votes" ADD CONSTRAINT "location_votes_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "poll_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_votes" ADD CONSTRAINT "location_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
