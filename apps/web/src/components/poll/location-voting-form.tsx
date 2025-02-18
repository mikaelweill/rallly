"use client";
import * as React from "react";
import { Controller } from "react-hook-form";

import { useVotingForm } from "@/components/poll/voting-form";
import { usePoll } from "@/components/poll-context";

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
        <div className="divide-y">
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
                                const newValue = [...(field.value || [])];
                                newValue[index] = { locationId: location.id, type: newVote };
                                field.onChange(newValue);
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
    );
};

export default LocationVotingForm; 