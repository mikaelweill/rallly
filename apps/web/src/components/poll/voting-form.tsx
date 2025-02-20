import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import { NewParticipantForm } from "@/components/new-participant-modal";
import { useParticipants } from "@/components/participants-provider";
import {
  normalizeVotes,
  normalizeVotesForDisplay,
  useUpdateParticipantMutation,
} from "@/components/poll/mutations";
import { Trans } from "@/components/trans";
import { usePermissions } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";
import { useRole } from "@/contexts/role";
import { Button } from "@rallly/ui/button";

const formSchema = z.object({
  mode: z.enum(["new", "edit", "view"]),
  participantId: z.string().optional(),
  votes: z.array(
    z
      .object({
        optionId: z.string(),
        type: z.enum(["yes", "no", "ifNeedBe"]).optional(),
      })
      .optional(),
  ),
  locationVotes: z.array(
    z
      .object({
        locationId: z.string(),
        type: z.enum(["yes", "no", "ifNeedBe"]).optional(),
      })
      .optional(),
  ),
  startLocation: z.object({
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    transportMode: z.string().optional(),
  }).optional(),
});

type VotingFormValues = z.infer<typeof formSchema>;

export const useVotingForm = () => {
  const { options, locations } = usePoll();
  const { participants } = useParticipants();
  const form = useFormContext<VotingFormValues>();

  return {
    ...form,
    newParticipant: () => {
      form.reset({
        mode: "new",
        participantId: undefined,
        votes: options.map((option) => ({
          optionId: option.id,
        })),
        locationVotes: locations?.map((location) => ({
          locationId: location.id,
        })) ?? [],
      });
    },
    setEditingParticipantId: (newParticipantId: string) => {
      const participant = participants.find((p) => p.id === newParticipantId);
      if (participant) {
        form.reset({
          mode: "edit",
          participantId: newParticipantId,
          votes: options.map((option) => ({
            optionId: option.id,
            type: participant.votes.find((vote) => vote.optionId === option.id)
              ?.type,
          })),
          locationVotes: locations?.map((location) => ({
            locationId: location.id,
            type: participant.locationVotes?.find(
              (vote) => vote.locationId === location.id,
            )?.type,
          })) ?? [],
        });
      } else {
        console.error("Participant not found");
      }
    },
    cancel: () =>
      form.reset({
        mode: "view",
        participantId: undefined,
        votes: options.map((option) => ({
          optionId: option.id,
        })),
        locationVotes: locations?.map((location) => ({
          locationId: location.id,
        })) ?? [],
      }),
  };
};

export const VotingForm = ({ children }: React.PropsWithChildren) => {
  const { id: pollId, options, locations } = usePoll();
  const updateParticipant = useUpdateParticipantMutation();
  const { participants } = useParticipants();
  const { t } = useTranslation();

  const { canAddNewParticipant, canEditParticipant } = usePermissions();
  const userAlreadyVoted = participants.some((participant) =>
    canEditParticipant(participant.id),
  );

  const role = useRole();
  const optionIds = options.map((option) => option.id);
  const locationIds = locations?.map((location) => location.id) ?? [];

  const [isNewParticipantModalOpen, setIsNewParticipantModalOpen] =
    React.useState(false);

  const form = useForm<VotingFormValues>({
    defaultValues: {
      mode:
        canAddNewParticipant && !userAlreadyVoted && role === "participant"
          ? "new"
          : "view",
      participantId:
        role === "participant"
          ? participants.find((p) => canEditParticipant(p.id))?.id
          : undefined,
      votes: options.map((option) => ({
        optionId: option.id,
      })),
      locationVotes: locations?.map((location) => ({
        locationId: location.id,
      })) ?? [],
    },
  });

  const mode = form.watch("mode");
  const startLocation = form.watch("startLocation");

  console.log("[VotingForm] Current form state:", {
    mode,
    startLocation,
    allValues: form.getValues(),
  });

  return (
    <FormProvider {...form}>
      <form
        id="voting-form"
        onSubmit={form.handleSubmit(async (data) => {
          console.log("[VotingForm] Form submission:", {
            data,
            startLocation: form.getValues("startLocation"),
          });

          if (data.participantId) {
            // update participant
            await updateParticipant.mutateAsync({
              participantId: data.participantId,
              pollId,
              votes: normalizeVotes(optionIds, data.votes),
              locationVotes: normalizeVotes(locationIds, data.locationVotes),
            });

            form.reset({
              mode: "view",
              participantId: data.participantId,
              votes: options.map((option) => ({
                optionId: option.id,
              })),
              locationVotes: locations?.map((location) => ({
                locationId: location.id,
              })) ?? [],
            });
          } else {
            // new participant
            console.log("[VotingForm] Opening confirmation modal with:", {
              votes: normalizeVotesForDisplay(optionIds, form.watch("votes")),
              locationVotes: normalizeVotesForDisplay(locationIds, form.watch("locationVotes")),
              startLocation: form.watch("startLocation"),
            });
            setIsNewParticipantModalOpen(true);
          }
        })}
      >
        {children}

        {(mode === "new" || mode === "edit") && (
          <div className="sticky left-[240px] flex w-[calc(100%-240px)] items-center justify-between gap-4 border-l border-t bg-gray-50 p-3">
            <Button
              onClick={() => {
                form.reset({
                  mode: "view",
                  participantId: undefined,
                  votes: options.map((option) => ({
                    optionId: option.id,
                  })),
                  locationVotes: locations?.map((location) => ({
                    locationId: location.id,
                  })) ?? [],
                });
              }}
            >
              <Trans i18nKey="cancel" />
            </Button>
            <p className="hidden min-w-0 truncate text-sm md:block">
              <Trans
                i18nKey="saveInstruction"
                values={{
                  action: mode === "new" ? t("continue") : t("save"),
                }}
                components={{
                  b: <strong className="font-semibold" />,
                }}
              />
            </p>
            <Button type="submit" variant="primary">
              <Trans i18nKey={mode === "new" ? "continue" : "save"} />
            </Button>
          </div>
        )}
      </form>

      <Dialog
        open={isNewParticipantModalOpen}
        onOpenChange={setIsNewParticipantModalOpen}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="newParticipant" />
            </DialogTitle>
            <DialogDescription>
              <Trans i18nKey="newParticipantFormDescription" />
            </DialogDescription>
          </DialogHeader>
          <NewParticipantForm
            votes={normalizeVotesForDisplay(optionIds, form.watch("votes"))}
            locationVotes={normalizeVotesForDisplay(locationIds, form.watch("locationVotes"))}
            startLocation={form.watch("startLocation")}
            onSubmit={(newParticipant) => {
              console.log("[VotingForm] NewParticipantForm submission:", {
                newParticipant,
                startLocation: form.watch("startLocation"),
              });
              form.reset({
                mode: "view",
                participantId: newParticipant.id,
                votes: options.map((option) => ({
                  optionId: option.id,
                })),
                locationVotes: locations?.map((location) => ({
                  locationId: location.id,
                })) ?? [],
                startLocation: form.getValues("startLocation"),
              });
              setIsNewParticipantModalOpen(false);
            }}
            onCancel={() => setIsNewParticipantModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
};
