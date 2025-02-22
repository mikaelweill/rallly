import type { Participant, Vote } from "@rallly/database";

export type ParticipantWithStartLocation = Participant & {
    votes: Vote[];
    startLocation?: {
        latitude: number;
        longitude: number;
        transportMode?: string;
        address?: string;
    };
    locationVotes?: Array<{
        locationId: string;
        type?: "yes" | "no" | "ifNeedBe";
    }>;
}; 