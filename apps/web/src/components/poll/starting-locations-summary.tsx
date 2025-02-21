import type { Participant } from "@rallly/database";
import { Card, CardHeader, CardTitle } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { NavigationIcon, MapPinIcon, Car, PersonStanding, Bike, Bus } from "lucide-react";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { useParticipants } from "@/components/participants-provider";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { usePoll } from "@/components/poll-context";

type ParticipantWithStartLocation = Participant & {
    startLocation?: {
        address: string;
        latitude: number;
        longitude: number;
        transportMode?: string;
    };
};

const TransportIcon = ({ mode }: { mode?: string }) => {
    switch (mode?.toUpperCase()) {
        case 'DRIVING':
            return <Car className="h-4 w-4" />;
        case 'WALKING':
            return <PersonStanding className="h-4 w-4" />;
        case 'BICYCLING':
            return <Bike className="h-4 w-4" />;
        case 'TRANSIT':
            return <Bus className="h-4 w-4" />;
        default:
            return <Car className="h-4 w-4" />;
    }
};

export const StartingLocationsSummary: React.FunctionComponent = () => {
    const { t } = useTranslation();
    const { participants } = useParticipants();
    const { poll } = usePoll();

    if (!poll.isLocationOptimized) {
        return null;
    }

    const participantsWithLocation = (participants as ParticipantWithStartLocation[]).filter(
        (participant) => participant.startLocation,
    );

    if (participantsWithLocation.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Icon>
                        <NavigationIcon className="h-4 w-4" />
                    </Icon>
                    <CardTitle>Starting Locations</CardTitle>
                </div>
            </CardHeader>
            <div className="space-y-4 p-4">
                {participantsWithLocation.map((participant) => (
                    <div key={participant.id} className="flex items-start gap-3">
                        <OptimizedAvatarImage name={participant.name} size="sm" />
                        <div className="space-y-1">
                            <div className="font-medium">{participant.name}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPinIcon className="h-4 w-4" />
                                <span>{participant.startLocation?.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Icon>
                                    <TransportIcon mode={participant.startLocation?.transportMode} />
                                </Icon>
                                <span>
                                    {participant.startLocation?.transportMode
                                        ? participant.startLocation.transportMode.charAt(0).toUpperCase() +
                                        participant.startLocation.transportMode.slice(1).toLowerCase()
                                        : 'Driving'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}; 