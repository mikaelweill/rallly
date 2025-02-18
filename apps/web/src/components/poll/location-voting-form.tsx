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

import { useVotingForm } from "@/components/poll/voting-form";
import { usePoll } from "@/components/poll-context";
import { usePermissions } from "@/contexts/permissions";
import { useParticipants } from "@/components/participants-provider";

import LocationOption from "./location-option";

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
            <div className="divide-y p-4">
                {poll.locations.map((location, index) => {
                    const participants = getParticipantsWhoVotedForOption(location.id);
                    const score = getScore(location.id);

                    return (
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
                                    <LocationOption
                                        locationId={location.id}
                                        address={location.address}
                                        placeId={location.placeId}
                                        lat={location.lat}
                                        lng={location.lng}
                                        onChange={handleChange}
                                        vote={vote}
                                        editable={editable}
                                        participants={participants}
                                        selectedParticipantId={selectedParticipant?.id}
                                    />
                                );
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default LocationVotingForm; 