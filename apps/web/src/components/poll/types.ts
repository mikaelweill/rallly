import type { VoteType } from "@rallly/database";

export interface ParticipantForm {
  votes: Array<
    | {
      optionId: string;
      type?: VoteType;
    }
    | undefined
  >;
  locationVotes?: Array<
    | {
      locationId: string;
      type?: VoteType;
    }
    | undefined
  >;
}

export interface ParticipantFormSubmitted {
  votes: Array<{ optionId: string; type: VoteType }>;
  locationVotes?: Array<{ locationId: string; type: VoteType }>;
}
