import { Icon } from "@rallly/ui/icon";
import { MapPinIcon } from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";

import { LocationMap } from "@/components/location-map";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { usePoll } from "@/contexts/poll";

const libraries: ["places"] = ["places"];

export function PollLocations() {
    const poll = usePoll();
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });

    if (!poll.locations || poll.locations.length === 0) {
        return null;
    }

    return (
        <div className="rounded-lg border bg-white">
            <div className="space-y-2 p-4">
                <div className="space-y-1">
                    {poll.locations.map((location, index) => (
                        <p key={location.id} className="text-muted-foreground truncate whitespace-nowrap text-sm">
                            <Icon>
                                <MapPinIcon className="-mt-0.5 mr-1.5 inline-block" />
                            </Icon>
                            <TruncatedLinkify>{`${index + 1}. ${location.address}`}</TruncatedLinkify>
                        </p>
                    ))}
                </div>
                <LocationMap
                    address={poll.locations[0].address}
                    locations={poll.locations}
                    className="h-48 w-full"
                    isLoaded={isLoaded}
                />
            </div>
        </div>
    );
} 