import { usePostHog } from "@rallly/posthog/client";
import { signIn, useSession } from "next-auth/react";

import { usePoll } from "@/components/poll-context";
import { trpc } from "@/trpc/client";

import type { ParticipantForm } from "./types";

export const normalizeVotes = (
  optionIds: string[],
  votes: ParticipantForm["votes"] | ParticipantForm["locationVotes"],
) => {
  return optionIds.map((id, i) => ({
    optionId: "optionId" in (votes?.[i] ?? {}) ? id : undefined,
    locationId: "locationId" in (votes?.[i] ?? {}) ? id : undefined,
    type: votes[i]?.type ?? ("no" as const),
  }));
};

export const useAddParticipantMutation = () => {
  const posthog = usePostHog();
  const queryClient = trpc.useUtils();
  const session = useSession();
  return trpc.polls.participants.add.useMutation({
    onMutate: async () => {
      if (session.status !== "authenticated") {
        await signIn("guest", {
          redirect: false,
        });
      }
    },
    onSuccess: async (newParticipant, input) => {
      const { pollId, name, email } = newParticipant;
      queryClient.polls.participants.list.setData(
        { pollId },
        (existingParticipants = []) => {
          return [
            {
              ...newParticipant,
              votes: input.votes,
              locationVotes: input.locationVotes,
            },
            ...existingParticipants,
          ];
        },
      );

      posthog?.capture("add participant", {
        pollId,
        name,
        email,
      });
    },
  });
};

export const useUpdateParticipantMutation = () => {
  const posthog = usePostHog();
  const queryClient = trpc.useUtils();
  return trpc.polls.participants.update.useMutation({
    onSuccess: async (updatedParticipant, input) => {
      const { pollId, participantId } = input;
      queryClient.polls.participants.list.setData(
        { pollId },
        (existingParticipants = []) => {
          return existingParticipants.map((participant) => {
            if (participant.id === participantId) {
              return {
                ...participant,
                ...updatedParticipant,
                votes: input.votes,
                locationVotes: input.locationVotes,
              };
            }
            return participant;
          });
        },
      );

      posthog?.capture("update participant", {
        pollId,
        participantId,
      });
    },
  });
};

export const useDeleteParticipantMutation = () => {
  const queryClient = trpc.useUtils();
  const posthog = usePostHog();
  const { poll } = usePoll();
  return trpc.polls.participants.delete.useMutation({
    onMutate: ({ participantId }) => {
      queryClient.polls.participants.list.setData(
        { pollId: poll.id },
        (existingParticipants = []) => {
          return existingParticipants.filter(({ id }) => id !== participantId);
        },
      );
    },
    onSuccess: (_, { participantId }) => {
      posthog?.capture("remove participant", {
        pollId: poll.id,
        participantId,
      });
    },
  });
};

export const useUpdatePollMutation = () => {
  const posthog = usePostHog();
  return trpc.polls.update.useMutation({
    onSuccess: (_data, { urlId }) => {
      posthog?.capture("updated poll", {
        id: urlId,
      });
    },
  });
};
