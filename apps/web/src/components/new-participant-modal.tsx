import { zodResolver } from "@hookform/resolvers/zod";
import type { VoteType } from "@rallly/database";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { FormMessage } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import * as Sentry from "@sentry/nextjs";
import { TRPCClientError } from "@trpc/client";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import z from "zod";
import { Icon } from "@rallly/ui/icon";
import { MapPinIcon, Users2Icon, NavigationIcon } from "lucide-react";
import { Trans } from "react-i18next";

import { usePoll } from "@/contexts/poll";
import { useDayjs } from "@/utils/dayjs";

import { useAddParticipantMutation } from "./poll/mutations";
import VoteIcon from "./poll/vote-icon";
import { useUser } from "./user-provider";

const requiredEmailSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

const optionalEmailSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().or(z.literal("")),
});

const schema = z.discriminatedUnion("requireEmail", [
  z.object({ requireEmail: z.literal(true) }).merge(requiredEmailSchema),
  z.object({ requireEmail: z.literal(false) }).merge(optionalEmailSchema),
]);

type NewParticipantFormData = z.infer<typeof schema>;

interface NewParticipantModalProps {
  votes: { optionId: string; type: VoteType }[];
  locationVotes?: { locationId: string; type: VoteType }[];
  onSubmit?: (data: { id: string }) => void;
  onCancel?: () => void;
  startLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    transportMode?: string;
  };
}

const VoteSummary = ({
  votes,
  className,
}: {
  className?: string;
  votes: { optionId?: string; locationId?: string; type: VoteType }[];
}) => {
  const { t } = useTranslation();
  const poll = usePoll();
  const { dayjs, adjustTimeZone } = useDayjs();

  const voteByType = votes.reduce<Record<VoteType, string[]>>(
    (acc, vote) => {
      if (!vote.type) {
        return acc;
      }
      const id = vote.optionId || vote.locationId;
      if (!id) return acc;
      acc[vote.type] = [...(acc[vote.type] || []), id];
      return acc;
    },
    { yes: [], ifNeedBe: [], no: [] },
  );

  const renderVoteDetails = (voteType: VoteType, voteIds: string[]) => {
    const items = voteIds.map((id) => {
      const isTimeVote = votes[0]?.optionId !== undefined;
      if (isTimeVote) {
        // Time votes
        const option = poll.options.find((opt) => opt.id === id);
        if (!option) return null;

        const start = adjustTimeZone(option.startTime, !poll.timeZone);
        const end = option.duration > 0
          ? adjustTimeZone(dayjs(option.startTime).add(option.duration, "minutes"), !poll.timeZone)
          : null;

        return (
          <div key={id} className="text-sm text-muted-foreground">
            <div>{start.format("dddd, LL")}</div>
            {end ? (
              <div className="text-sm opacity-75">
                {`${start.format("LT")} - ${end.format(poll.timeZone ? "LT z" : "LT")}`}
              </div>
            ) : (
              <div className="text-sm opacity-75">{t("allDay")}</div>
            )}
          </div>
        );
      } else {
        // Location votes
        const location = poll.locations?.find((loc) => loc.id === id);
        if (!location) return null;
        const locationIndex = poll.locations?.findIndex((loc) => loc.id === id) ?? 0;
        return (
          <div key={id} className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-gray-500" />
              <span>{`${locationIndex + 1}. ${location.address}`}</span>
            </div>
          </div>
        );
      }
    });

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <VoteIcon type={voteType} />
          <div className="font-medium">{t(voteType)}</div>
        </div>
        <div className="ml-6 space-y-2">
          {items}
        </div>
      </div>
    );
  };

  return (
    <div className={clsx("space-y-3 rounded border p-3", className)}>
      {Object.entries(voteByType).map(([type, ids]) => {
        if (ids.length === 0) return null;
        return (
          <div key={type}>
            {renderVoteDetails(type as VoteType, ids)}
          </div>
        );
      })}
    </div>
  );
};

export const NewParticipantForm = (props: NewParticipantModalProps) => {
  const { t } = useTranslation();
  const poll = usePoll();

  console.log("[NewParticipantForm] Props:", {
    isLocationOptimized: poll.isLocationOptimized,
    startLocation: props.startLocation,
    locationVotes: props.locationVotes,
  });

  const isEmailRequired = poll.requireParticipantEmail;

  const { user } = useUser();
  const isLoggedIn = !user.isGuest;
  const { register, setError, formState, handleSubmit } =
    useForm<NewParticipantFormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        requireEmail: isEmailRequired,
        ...(isLoggedIn
          ? {
            name: user.name,
            email: user.email || undefined,
          }
          : {}),
      },
    });

  const addParticipant = useAddParticipantMutation();

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        try {
          const participant = await addParticipant.mutateAsync({
            pollId: poll.id,
            name: data.name,
            email: data.email,
            votes: props.votes,
            locationVotes: props.locationVotes,
            startLocation: props.startLocation,
          });

          props.onSubmit?.(participant);
        } catch (err) {
          if (err instanceof TRPCClientError) {
            if (err.data?.code === "CONFLICT") {
              setError("email", {
                message: t("userAlreadyExists"),
              });
              return;
            }
          }

          Sentry.captureException(err);
        }
      })}
      className="space-y-4"
    >
      <div className="space-y-4">
        <div>
          <Input
            autoFocus={!isLoggedIn}
            disabled={isLoggedIn}
            {...register("name")}
            placeholder={t("name")}
          />
          <FormMessage>{formState.errors.name?.message}</FormMessage>
        </div>
        <div>
          <Input
            disabled={isLoggedIn}
            {...register("email")}
            placeholder={
              isEmailRequired
                ? t("email")
                : t("optional")
            }
          />
          <FormMessage>{formState.errors.email?.message}</FormMessage>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Icon><Users2Icon className="h-4 w-4" /></Icon>
            <Trans i18nKey="dates" />
          </div>
        </div>
        <VoteSummary votes={props.votes} />
        {props.locationVotes && props.locationVotes.length > 0 && (
          <>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon><MapPinIcon className="h-4 w-4" /></Icon>
                <Trans i18nKey="location" />
              </div>
            </div>
            <VoteSummary votes={props.locationVotes} />
          </>
        )}
        {props.startLocation && (
          <>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon><NavigationIcon className="h-4 w-4" /></Icon>
                Starting Location
              </div>
            </div>
            <div className="rounded border p-3">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{props.startLocation.address}</span>
              </div>
              {props.startLocation.transportMode && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Transport mode: {props.startLocation.transportMode.toLowerCase()}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={props.onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit" loading={addParticipant.isLoading}>
          {t("submit")}
        </Button>
      </div>
    </form>
  );
};
