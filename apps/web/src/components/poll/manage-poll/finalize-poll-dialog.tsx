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
import type { Participant } from "@rallly/database";
import type { Vote } from "@/trpc/client/types";

import { DateIconInner } from "@/components/date-icon";
import { useParticipants } from "@/components/participants-provider";
import { ConnectedScoreSummary } from "@/components/poll/score-summary";
import { LocationScoreSummary } from "@/components/poll/location-score-summary";
import { VoteSummaryProgressBar } from "@/components/vote-summary-progress-bar";
import { usePoll } from "@/contexts/poll";
import { trpc } from "@/trpc/client";
import { useDayjs } from "@/utils/dayjs";
import { StartingLocationsSummary } from "@/components/poll/starting-locations-summary";
import { VenueOptimizer } from "@/utils/venue-optimizer";

const formSchema = z.object({
  selectedOptionId: z.string(),
  selectedLocationId: z.string().optional(),
  notify: z.enum(["none", "all", "attendees"]),
  optimizationType: z.enum(["eta", "distance"]),
});

type FinalizeFormData = z.infer<typeof formSchema>;

type OptionScore = {
  yes: string[];
  ifNeedBe: string[];
  no: string[];
};

// Extend the base Participant type with our additional fields
type ParticipantWithLocation = Participant & {
  votes: Vote[];
  startLocation?: {
    latitude: number;
    longitude: number;
    transportMode?: string;
  };
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

    (responses as ParticipantWithLocation[]).forEach((response) => {
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
  const [optimizedVenues, setOptimizedVenues] = useState<Array<{
    placeId: string;
    name: string;
    address: string;
    metrics: {
      minDistance?: number;
      maxDistance?: number;
      avgDistance?: number;
      minEta?: number;
      maxEta?: number;
      avgEta?: number;
    };
  }> | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

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
      // Check if we have at least 2 participants with locations and a selected date and optimization type
      const participantsWithLocation = (participants as ParticipantWithLocation[])
        .filter((p) => p.startLocation);

      console.log("Calculate button conditions:", {
        selectedOptionId: value.selectedOptionId,
        optimizationType: value.optimizationType,
        participantsWithLocation: participantsWithLocation.length,
        participants: (participants as ParticipantWithLocation[]).map(p => ({
          id: p.id,
          hasLocation: !!p.startLocation,
          startLocation: p.startLocation
        }))
      });

      setCanCalculate(
        !!value.selectedOptionId &&
        !!value.optimizationType &&
        participantsWithLocation.length >= 2
      );
    });
    return () => subscription.unsubscribe();
  }, [form, participants]);

  const handleCalculate = async () => {
    const formData = form.getValues();
    setIsCalculating(true);
    try {
      const participantsWithLocation = (participants as ParticipantWithLocation[])
        .filter((p) => p.startLocation);

      const selectedDate = poll.options.find(
        (opt) => opt.id === formData.selectedOptionId,
      )?.startTime;

      if (!selectedDate) {
        console.error("No date selected");
        return;
      }

      const optimizer = new VenueOptimizer(
        participantsWithLocation.map((p) => {
          // Calculate response weight based on the participant's vote for the selected date
          const participantVotes = scoreByOptionId[formData.selectedOptionId];
          let responseWeight = 0;
          if (participantVotes.yes.includes(p.id)) {
            responseWeight = 1;
          } else if (participantVotes.ifNeedBe.includes(p.id)) {
            responseWeight = 0.5;
          }

          return {
            location: p.startLocation!,
            transportMode: p.startLocation?.transportMode || "DRIVING",
            responseWeight,
          };
        }),
        selectedDate,
        {
          type: poll.venuePreferences?.venueType || undefined,
          minRating: poll.venuePreferences?.minRating || undefined,
          maxPrice: poll.venuePreferences?.priceLevel || undefined,
          radius: 3000, // 3km radius
        }
      );

      const venues = await optimizer.findOptimalVenues(formData.optimizationType);
      setOptimizedVenues(venues);
    } catch (error) {
      console.error("Failed to calculate optimal venues:", error);
    } finally {
      setIsCalculating(false);
    }
  };

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
                      className="grid grid-cols-2 gap-2 overflow-y-auto rounded-lg border bg-gray-100 p-2"
                    >
                      <label
                        htmlFor="eta"
                        className={cn(
                          "group flex select-none items-center justify-center gap-4 rounded-lg border bg-white p-3 text-base",
                          field.value === "eta" ? "border-primary ring-2 ring-primary ring-offset-2" : ""
                        )}
                      >
                        <RadioGroupItem id="eta" value="eta" />
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          Optimize for ETA
                        </div>
                      </label>
                      <label
                        htmlFor="distance"
                        className={cn(
                          "group flex select-none items-center justify-center gap-4 rounded-lg border bg-white p-3 text-base",
                          field.value === "distance" ? "border-primary ring-2 ring-primary ring-offset-2" : ""
                        )}
                      >
                        <RadioGroupItem id="distance" value="distance" />
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4" />
                          Optimize for Distance
                        </div>
                      </label>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={!canCalculate}
                  loading={isCalculating}
                  onClick={handleCalculate}
                >
                  <NavigationIcon className="mr-2 h-4 w-4" />
                  Calculate Optimal Venues
                </Button>
              </div>
              {optimizedVenues && (
                <div className="rounded-lg border bg-white p-4">
                  <h3 className="mb-4 font-medium">Top Venue Recommendations</h3>
                  <div className="space-y-4">
                    {optimizedVenues.map((venue, index) => (
                      <div key={venue.placeId} className="flex items-start gap-4 rounded-lg border p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{venue.name}</div>
                          <div className="text-sm text-gray-500">{venue.address}</div>
                          <div className="mt-2 text-sm">
                            {form.getValues("optimizationType") === "distance" ? (
                              <>
                                <div>Min Distance: {(venue.metrics.minDistance || 0).toFixed(1)} km</div>
                                <div>Max Distance: {(venue.metrics.maxDistance || 0).toFixed(1)} km</div>
                                <div>Avg Distance: {(venue.metrics.avgDistance || 0).toFixed(1)} km</div>
                              </>
                            ) : (
                              <>
                                <div>Min ETA: {(venue.metrics.minEta || 0).toFixed(1)} min</div>
                                <div>Max ETA: {(venue.metrics.maxEta || 0).toFixed(1)} min</div>
                                <div>Avg ETA: {(venue.metrics.avgEta || 0).toFixed(1)} min</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  <Trans i18nKey="notifications" defaults="Notify" />
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
                          <Trans i18nKey="notificationsOff" defaults="None" />
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
                          <Trans i18nKey="notificationsOn" defaults="All" />
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
                          <Trans i18nKey="participants" defaults="Attendees" />
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
