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

import { usePoll } from "@/contexts/poll";
import { useDayjs } from "@/utils/dayjs";

import { useAddParticipantMutation } from "./poll/mutations";
import VoteIcon from "./poll/vote-icon";
import { useUser } from "./user-provider";

const requiredEmailSchema = z.object({
  requireEmail: z.literal(true),
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

const optionalEmailSchema = z.object({
  requireEmail: z.literal(false),
  name: z.string().min(1).max(100),
  email: z.string().email().or(z.literal("")),
});

const schema = z.union([requiredEmailSchema, optionalEmailSchema]);

type NewParticipantFormData = z.infer<typeof schema>;

interface NewParticipantModalProps {
  votes: { optionId: string; type: VoteType }[];
  locationVotes?: { locationId: string; type: VoteType }[];
  onSubmit?: (data: { id: string }) => void;
  onCancel?: () => void;
}

const VoteSummary = ({
  votes,
  className,
}: {
  className?: string;
  votes: { optionId: string; type: VoteType }[] | { locationId: string; type: VoteType }[];
}) => {
  const { t } = useTranslation();
  const poll = usePoll();
  const { dayjs, adjustTimeZone } = useDayjs();

  const voteByType = votes.reduce<Record<VoteType, string[]>>(
    (acc, vote) => {
      if (!vote.type) {
        return acc;
      }
      acc[vote.type] = acc[vote.type] ? [...acc[vote.type], "optionId" in vote ? vote.optionId : vote.locationId] : ["optionId" in vote ? vote.optionId : vote.locationId];
      return acc;
    },
    { yes: [], ifNeedBe: [], no: [] },
  );

  const renderVoteDetails = (voteType: VoteType, voteIds: string[]) => {
    const items = voteIds.map((id) => {
      if ("optionId" in votes[0]) {
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
        return (
          <div key={id} className="text-sm text-muted-foreground">
            {location.address}
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
            email: user.email,
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
          });

          props.onSubmit?.(participant);
        } catch (err) {
          if (err instanceof TRPCClientError) {
            if (err.data?.code === "CONFLICT") {
              setError("email", {
                message: t("errors.emailAlreadyExists"),
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
                ? t("emailRequired")
                : t("emailOptional")
            }
          />
          <FormMessage>{formState.errors.email?.message}</FormMessage>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">{t("yourVotes")}</div>
        <VoteSummary votes={props.votes} />
        {props.locationVotes && props.locationVotes.length > 0 && (
          <>
            <div className="text-sm text-muted-foreground">{t("yourLocationVotes")}</div>
            <VoteSummary votes={props.locationVotes} />
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
