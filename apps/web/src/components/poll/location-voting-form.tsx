"use client";
import * as React from "react";
import { Controller } from "react-hook-form";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { CardHeader, CardTitle } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { PlusIcon } from "lucide-react";
import { Trans } from "next-i18next";
import { cn } from "@rallly/ui";
import { MapPinIcon } from "lucide-react";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { useVotingForm } from "@/components/poll/voting-form";
import { usePoll } from "@/components/poll-context";
import { usePermissions } from "@/contexts/permissions";
import { useParticipants } from "@/components/participants-provider";

import LocationOption from "./location-option";
import VoteSelector from "@/components/poll/vote-selector";
import VoteIcon from "@/components/poll/vote-icon";

export interface LocationVotingFormProps {
    editable?: boolean;
    selectedParticipantId?: string;
}

const LocationVotingForm: React.FunctionComponent<LocationVotingFormProps> = ({
    editable,
    selectedParticipantId,
}) => {
    const { control } = useVotingForm();
    const {
        getParticipantsWhoVotedForOption,
        getParticipantById,
        getScore,
        getVote,
        poll,
    } = usePoll();
    const { canAddNewParticipant } = usePermissions();
    const { participants } = useParticipants();
    const votingForm = useVotingForm();
    const mode = votingForm.watch("mode");

    const selectedParticipant = selectedParticipantId
        ? getParticipantById(selectedParticipantId)
        : undefined;

    if (!poll.locations?.length) {
        return (
            <div className="p-4 text-center text-sm text-gray-500">
                No locations to vote on
            </div>
        );
    }

    return (
        <div>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
                <div className="flex items-center gap-x-2.5">
                    <CardTitle>
                        <Trans i18nKey="participants" />
                    </CardTitle>
                    <Badge>{participants.length}</Badge>
                    {canAddNewParticipant && mode !== "new" ? (
                        <Button
                            className="ml-2"
                            size="sm"
                            data-testid="add-participant-button"
                            onClick={() => {
                                votingForm.newParticipant();
                            }}
                        >
                            <Icon>
                                <PlusIcon />
                            </Icon>
                        </Button>
                    ) : null}
                </div>
            </CardHeader>
            <div className="relative">
                <div className="scrollbar-thin hover:scrollbar-thumb-gray-400 scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative z-10 flex-grow overflow-auto scroll-smooth">
                    <table className="w-full table-auto border-separate border-spacing-0 bg-gray-50">
                        <thead>
                            <tr>
                                <th className="sticky left-0 z-30 w-[240px] bg-white pl-4 pr-4">
                                    <div className="text-sm font-medium">Locations</div>
                                </th>
                                {participants.map((participant) => (
                                    <th
                                        key={participant.id}
                                        className="h-12 min-w-[80px] border-l bg-gray-50 px-2"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <OptimizedAvatarImage size="xs" name={participant.name} />
                                            <div className="truncate text-xs font-normal">
                                                {participant.name}
                                            </div>
                                        </div>
                                    </th>
                                ))}
                                <th className="w-full min-w-4 border-l"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {poll.locations.map((location, index) => (
                                <Controller
                                    key={location.id}
                                    control={control}
                                    name={`locationVotes.${index}`}
                                    render={({ field }) => {
                                        const vote =
                                            !editable && selectedParticipant
                                                ? getVote(selectedParticipant.id, location.id)
                                                : field.value?.type;

                                        const handleChange = (newVote: VoteType) => {
                                            if (!editable) {
                                                return;
                                            }
                                            field.onChange({ locationId: location.id, type: newVote });
                                        };

                                        return (
                                            <tr className="group">
                                                <td className="sticky left-0 z-10 h-12 bg-white px-4">
                                                    <div className="flex items-center gap-x-2 text-sm">
                                                        <MapPinIcon className="size-4 text-gray-500" />
                                                        <div className="truncate">{location.address}</div>
                                                    </div>
                                                </td>
                                                {participants.map((participant) => {
                                                    const participantVote = getVote(participant.id, location.id);
                                                    return (
                                                        <td
                                                            key={participant.id}
                                                            className={cn(
                                                                "h-12 border-l border-t",
                                                                !participantVote || participantVote === "no" ? "bg-gray-100" : "bg-white",
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-center">
                                                                <div
                                                                    className={cn(
                                                                        "inline-flex h-7 w-7 items-center justify-center rounded-full",
                                                                        {
                                                                            "bg-green-50": participantVote === "yes",
                                                                            "bg-amber-50": participantVote === "ifNeedBe",
                                                                            "bg-gray-200": participantVote === "no",
                                                                        },
                                                                    )}
                                                                >
                                                                    {editable && selectedParticipant?.id === participant.id ? (
                                                                        <VoteSelector
                                                                            value={vote}
                                                                            onChange={handleChange}
                                                                        />
                                                                    ) : (
                                                                        <VoteIcon type={participantVote} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="bg-diagonal-lines border-l"></td>
                                            </tr>
                                        );
                                    }}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LocationVotingForm; 