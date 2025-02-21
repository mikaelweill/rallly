import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import dayjs from "dayjs";
import { MapPinIcon } from "lucide-react";
import { Trans } from "next-i18next";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Clock, MapPin, NavigationIcon } from "lucide-react";

import { DateIconInner } from "@/components/date-icon";
import { useParticipants } from "@/components/participants-provider";
import { ConnectedScoreSummary } from "@/components/poll/score-summary";
import { LocationScoreSummary } from "@/components/poll/location-score-summary";
import { VoteSummaryProgressBar } from "@/components/vote-summary-progress-bar";
import { usePoll } from "@/contexts/poll";
import { trpc } from "@/trpc/client";
import { useDayjs } from "@/utils/dayjs";
import { StartingLocationsSummary } from "@/components/poll/starting-locations-summary";

const formSchema = z.object({
  selectedOptionId: z.string(),
  selectedLocationId: z.string().optional(),
  notify: z.enum(["none", "all", "attendees"]),
  optimizationType: z.enum(["eta", "distance"]).optional(),
});

type FinalizeFormData = z.infer<typeof formSchema>;

type OptionScore = {
  yes: string[];
  ifNeedBe: string[];
  no: string[];
};

type ParticipantWithLocationVotes = {
  id: string;
  locationVotes?: Array<{
    locationId: string;
    type?: "yes" | "no" | "ifNeedBe";
  }>;
};

const useScoreByOptionId = () => {
  const { participants: responses } = useParticipants();
  const { options } = usePoll();

  return React.useMemo(() => {
    const scoreByOptionId: Record<string, OptionScore> = {};
    options.forEach((option) => {
      scoreByOptionId[option.id] = {
        yes: [],
        ifNeedBe: [],
        no: [],
      };
    });

    responses?.forEach((response) => {
      response.votes.forEach((vote) => {
        scoreByOptionId[vote.optionId]?.[vote.type].push(response.id);
      });
    });

    return scoreByOptionId;
  }, [responses, options]);
};

const useLocationScoreById = () => {
  const { participants: responses } = useParticipants();
  const { locations } = usePoll();

  return React.useMemo(() => {
    const scoreByLocationId: Record<string, OptionScore> = {};
    locations?.forEach((location) => {
      scoreByLocationId[location.id] = {
        yes: [],
        ifNeedBe: [],
        no: [],
      };
    });

    (responses as ParticipantWithLocationVotes[]).forEach((response) => {
      response.locationVotes?.forEach((vote) => {
        if (vote.type && vote.locationId in scoreByLocationId) {
          scoreByLocationId[vote.locationId][vote.type].push(response.id);
        }
      });
    });

    return scoreByLocationId;
  }, [responses, locations]);
};

function DateIcon({ start }: { start: Date }) {
  const poll = usePoll();
  const { adjustTimeZone } = useDayjs();
  const d = adjustTimeZone(start, !poll.timeZone);
  return <DateIconInner dow={d.format("ddd")} day={d.format("D")} />;
}

export const FinalizePollForm = ({
  name,
  onSubmit,
}: {
  name: string;
  onSubmit?: (data: FinalizeFormData) => void;
}) => {
  const poll = usePoll();
  const { adjustTimeZone } = useDayjs();
  const scoreByOptionId = useScoreByOptionId();
  const scoreByLocationId = useLocationScoreById();
  const { participants } = useParticipants();
  const [canCalculate, setCanCalculate] = useState(false);

  const options = [...poll.options]
    .sort((a, b) => {
      const aYes = scoreByOptionId[a.id].yes.length;
      const bYes = scoreByOptionId[b.id].yes.length;
      const aIfNeedBe = scoreByOptionId[a.id].ifNeedBe.length;
      const bIfNeedBe = scoreByOptionId[b.id].ifNeedBe.length;

      const aTotal = aYes + aIfNeedBe;
      const bTotal = bYes + bIfNeedBe;

      if (aTotal !== bTotal) {
        return bTotal - aTotal;
      }

      if (aYes !== bYes) {
        return bYes - aYes;
      }

      return bIfNeedBe - aIfNeedBe;
    })
    .map((option) => {
      return { ...option, votes: scoreByOptionId[option.id] };
    });

  const form = useForm<FinalizeFormData>({
    defaultValues: {
      selectedOptionId: options[0].id,
      selectedLocationId: poll.locations?.[0]?.id,
      notify: "all",
      optimizationType: undefined,
    },
  });

  // Watch for form changes to enable/disable calculate button
  useEffect(() => {
    const subscription = form.watch((value) => {
      const participantsWithLocation = (participants as ParticipantWithLocationVotes[])
        .filter((p) => p.locationVotes && p.locationVotes.length > 0);

      setCanCalculate(
        !!value.selectedOptionId &&
        !!value.optimizationType &&
        participantsWithLocation.length >= 2
      );
    });
    return () => subscription.unsubscribe();
  }, [form, participants]);

  return (
    <Form {...form}>
      <form
        id={name}
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => {
          onSubmit?.(data);
        })}
      >
        <FormField
          control={form.control}
          name="selectedOptionId"
          render={({ field }) => {
            return (
              <FormItem className="relative">
                <FormLabel htmlFor={field.name}>
                  <Trans i18nKey="dates" />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid max-h-96 gap-2 overflow-y-auto rounded-lg border bg-gray-100 p-2"
                  >
                    {options.map((option) => {
                      const start = adjustTimeZone(
                        option.startTime,
                        !poll.timeZone,
                      );

                      const end = adjustTimeZone(
                        dayjs(option.startTime).add(option.duration, "minute"),
                        !poll.timeZone,
                      );

                      return (
                        <label
                          key={option.id}
                          htmlFor={option.id}
                          className={cn(
                            "group flex select-none items-start gap-4 rounded-lg border bg-white p-3 text-base",
                            field.value === option.id ? "" : "",
                          )}
                        >
                          <RadioGroupItem id={option.id} value={option.id} />
                          <div className="grow">
                            <div className="flex gap-x-4">
                              <DateIcon start={option.startTime} />
                              <div className="grow whitespace-nowrap">
                                <div className="text-sm font-medium">
                                  {start.format("LL")}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  {option.duration > 0 ? (
                                    `${start.format("LT")} - ${end.format(
                                      "LT",
                                    )}`
                                  ) : (
                                    <Trans
                                      i18nKey="allDay"
                                      defaults="All day"
                                    />
                                  )}
                                </div>
                              </div>
                              <div>
                                <ConnectedScoreSummary optionId={option.id} />
                              </div>
                            </div>
                            <div className="mt-4">
                              <VoteSummaryProgressBar
                                {...scoreByOptionId[option.id]}
                                total={participants.length}
                              />
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            );
          }}
        />

        {poll.locations && poll.locations.length > 0 && (
          <FormField
            control={form.control}
            name="selectedLocationId"
            render={({ field }) => {
              return (
                <FormItem className="relative">
                  <FormLabel htmlFor={field.name}>
                    <Trans i18nKey="location" defaults="Location" />
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid max-h-96 gap-2 overflow-y-auto rounded-lg border bg-gray-100 p-2"
                    >
                      {poll.locations.map((location, index) => {
                        return (
                          <label
                            key={location.id}
                            htmlFor={location.id}
                            className={cn(
                              "group flex select-none items-start gap-4 rounded-lg border bg-white p-3 text-base",
                              field.value === location.id ? "" : "",
                            )}
                          >
                            <RadioGroupItem id={location.id} value={location.id} />
                            <div className="grow">
                              <div className="flex gap-x-4">
                                <MapPinIcon className="size-4 text-gray-500" />
                                <div className="grow whitespace-nowrap">
                                  <div className="text-sm font-medium">
                                    {`${index + 1}. ${location.address}`}
                                  </div>
                                </div>
                                <div>
                                  <LocationScoreSummary locationId={location.id} />
                                </div>
                              </div>
                              <div className="mt-4">
                                <VoteSummaryProgressBar
                                  {...scoreByLocationId[location.id]}
                                  total={participants.length}
                                />
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              );
            }}
          />
        )}

        {poll.isLocationOptimized && (
          <>
            <StartingLocationsSummary />
            <FormField
              control={form.control}
              name="optimizationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Optimization Preference</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div>
                        <RadioGroupItem
                          value="eta"
                          id="eta"
                          className="peer sr-only"
                        />
                        <label
                          htmlFor="eta"
                          className="flex cursor-pointer items-center justify-center rounded-lg border bg-white p-4 text-sm peer-checked:border-primary peer-checked:text-primary"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Optimize for ETA
                        </label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="distance"
                          id="distance"
                          className="peer sr-only"
                        />
                        <label
                          htmlFor="distance"
                          className="flex cursor-pointer items-center justify-center rounded-lg border bg-white p-4 text-sm peer-checked:border-primary peer-checked:text-primary"
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          Optimize for Distance
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={!canCalculate}
                onClick={() => {
                  // TODO: Implement calculation
                  console.log("Calculate clicked");
                }}
              >
                <NavigationIcon className="mr-2 h-4 w-4" />
                Calculate Optimal Venues
              </Button>
            </div>
          </>
        )}

        <FormField
          control={form.control}
          name="notify"
          render={({ field }) => {
            return (
              <FormItem className="relative">
                <FormLabel htmlFor={field.name}>
                  <Trans i18nKey="notify" defaults="Notify" />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid max-h-96 gap-2 overflow-y-auto rounded-lg border bg-gray-100 p-2"
                  >
                    <label
                      htmlFor="notify-none"
                      className={cn(
                        "group flex select-none items-start gap-4 rounded-lg border bg-white p-3 text-base",
                        field.value === "none" ? "" : "",
                      )}
                    >
                      <RadioGroupItem id="notify-none" value="none" />
                      <div className="grow">
                        <div className="text-sm font-medium">
                          <Trans i18nKey="notifyNone" defaults="None" />
                        </div>
                      </div>
                    </label>
                    <label
                      htmlFor="notify-all"
                      className={cn(
                        "group flex select-none items-start gap-4 rounded-lg border bg-white p-3 text-base",
                        field.value === "all" ? "" : "",
                      )}
                    >
                      <RadioGroupItem id="notify-all" value="all" />
                      <div className="grow">
                        <div className="text-sm font-medium">
                          <Trans i18nKey="notifyAll" defaults="All" />
                        </div>
                      </div>
                    </label>
                    <label
                      htmlFor="notify-attendees"
                      className={cn(
                        "group flex select-none items-start gap-4 rounded-lg border bg-white p-3 text-base",
                        field.value === "attendees" ? "" : "",
                      )}
                    >
                      <RadioGroupItem id="notify-attendees" value="attendees" />
                      <div className="grow">
                        <div className="text-sm font-medium">
                          <Trans i18nKey="notifyAttendees" defaults="Attendees" />
                        </div>
                      </div>
                    </label>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            );
          }}
        />
      </form>
    </Form>
  );
};

export function FinalizePollDialog(props: DialogProps) {
  const poll = usePoll();
  const scheduleEvent = trpc.polls.book.useMutation();
  return (
    <Dialog {...props}>
      <DialogContent size="2xl">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="finalize" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="finalizeDescription"
              defaults="Select a final date and location for your event."
            />
          </DialogDescription>
        </DialogHeader>
        <FinalizePollForm
          name="finalize-form"
          onSubmit={(data) => {
            scheduleEvent.mutate({
              pollId: poll.id,
              optionId: data.selectedOptionId,
              locationId: data.selectedLocationId,
              notify: data.notify,
            });
            props.onOpenChange?.(false);
          }}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button>
              <Trans i18nKey="cancel" />
            </Button>
          </DialogClose>
          <Button
            loading={scheduleEvent.isLoading}
            type="submit"
            form="finalize-form"
            variant="primary"
          >
            <Trans i18nKey="finalize" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
