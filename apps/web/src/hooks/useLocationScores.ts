import type { Participant, VoteType } from "@rallly/database";
import * as React from "react";
import { useParticipants } from "@/components/participants-provider";
import { usePoll } from "@/components/poll-context";

type LocationScore = {
    yes: string[];
    ifNeedBe: string[];
    no: string[];
};

type LocationVote = {
    locationId: string;
    type: VoteType;
};

type ParticipantWithLocationVotes = Participant & {
    locationVotes?: LocationVote[];
};

export const useLocationScores = () => {
    const { participants } = useParticipants();
    const { poll } = usePoll();
    const locations = poll.locations ?? [];

    return React.useMemo(() => {
        const scoreByLocationId: Record<string, LocationScore> = {};
        locations.forEach((location) => {
            scoreByLocationId[location.id] = {
                yes: [],
                ifNeedBe: [],
                no: [],
            };
        });

        (participants as ParticipantWithLocationVotes[])?.forEach((participant) => {
            participant.locationVotes?.forEach((vote) => {
                if (vote.type in scoreByLocationId[vote.locationId]) {
                    scoreByLocationId[vote.locationId][vote.type].push(participant.id);
                }
            });
        });

        return scoreByLocationId;
    }, [participants, locations]);
}; 