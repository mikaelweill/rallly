"use client";
import Discussion from "@/components/discussion";
import { EventCard } from "@/components/event-card";
import { PollFooter } from "@/components/poll/poll-footer";
import { PollHeader } from "@/components/poll/poll-header";
import { PollLocations } from "@/components/poll/poll-locations";
import { ResponsiveResults } from "@/components/poll/responsive-results";
import { ScheduledEvent } from "@/components/poll/scheduled-event";
import { useTouchBeacon } from "@/components/poll/use-touch-beacon";
import { VotingForm } from "@/components/poll/voting-form";
import { usePoll } from "@/contexts/poll";

import { GuestPollAlert } from "./guest-poll-alert";
import { UnsubscribeAlert } from "./unsubscribe-alert";

export function AdminPage() {
  useTouchBeacon();
  const poll = usePoll();
  const isFinalized = poll.status === "finalized";

  return (
    <div className="space-y-3 lg:space-y-4">
      <UnsubscribeAlert />
      <PollHeader />
      <GuestPollAlert />
      <EventCard />
      {isFinalized ? (
        <>
          <ScheduledEvent />
          <VotingForm>
            <ResponsiveResults />
          </VotingForm>
          <PollLocations />
        </>
      ) : (
        <>
          <PollLocations />
          <VotingForm>
            <ResponsiveResults />
          </VotingForm>
        </>
      )}
      <Discussion />
      <PollFooter />
    </div>
  );
}
