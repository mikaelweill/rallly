import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { MapPinIcon, NavigationIcon } from "lucide-react";
import { useLoadScript, DistanceMatrixService } from "@react-google-maps/api";
import { useState } from "react";
import { Alert, AlertDescription } from "@rallly/ui/alert";

import { LocationMap } from "@/components/location-map";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { usePoll } from "@/contexts/poll";
import { useTranslation } from "@/i18n/client";

const libraries: ["places"] = ["places"];

type DistanceInfo = {
    distance: string;
    duration: string;
};

export function PollLocations() {
    const poll = usePoll();
    const { t } = useTranslation();
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [distances, setDistances] = useState<Record<string, DistanceInfo>>({});
    const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });

    if (!poll.locations || poll.locations.length === 0) {
        return null;
    }

    const handleCalculateDistances = async () => {
        setCalculating(true);
        setError(null);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });
            setUserLocation(position);

            if (!window.google?.maps?.DistanceMatrixService) {
                throw new Error("Google Maps Distance Matrix service is not available");
            }

            const service = new google.maps.DistanceMatrixService();
            const result = await service.getDistanceMatrix({
                origins: [{
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }],
                destinations: poll.locations.map(loc => ({
                    lat: loc.lat ?? 0,
                    lng: loc.lng ?? 0
                })),
                travelMode: google.maps.TravelMode.DRIVING,
            });

            const newDistances: Record<string, DistanceInfo> = {};
            result.rows[0].elements.forEach((element, index) => {
                if (element.status === "OK") {
                    newDistances[poll.locations[index].id] = {
                        distance: element.distance.text,
                        duration: element.duration.text
                    };
                }
            });
            setDistances(newDistances);
        } catch (error) {
            console.error("Error calculating distances:", error);
            if (error instanceof Error) {
                if (error.message.includes("REQUEST_DENIED")) {
                    setError("The Distance Matrix API is not enabled. Please contact the administrator.");
                } else if (error.message.includes("permission")) {
                    setError("Please allow location access to calculate distances.");
                } else {
                    setError("An error occurred while calculating distances. Please try again later.");
                }
            }
        } finally {
            setCalculating(false);
        }
    };

    return (
        <div className="rounded-lg border bg-white">
            <div className="space-y-2 p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium">Locations</h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCalculateDistances}
                        disabled={calculating || !isLoaded}
                    >
                        <Icon>
                            <NavigationIcon className="mr-2 h-4 w-4" />
                        </Icon>
                        {calculating ? "Calculating..." : "Calculate Distances"}
                    </Button>
                </div>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <div className="space-y-2">
                    {poll.locations.map((location, index) => (
                        <div key={location.id} className="flex items-center justify-between">
                            <p className="text-muted-foreground truncate whitespace-nowrap text-sm">
                                <Icon>
                                    <MapPinIcon className="-mt-0.5 mr-1.5 inline-block" />
                                </Icon>
                                <TruncatedLinkify>{`${index + 1}. ${location.address}`}</TruncatedLinkify>
                            </p>
                            {distances[location.id] && (
                                <div className="text-sm text-muted-foreground">
                                    <span className="mr-2">{distances[location.id].distance}</span>
                                    <span>({distances[location.id].duration})</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <LocationMap
                    address={poll.locations[0].address}
                    locations={poll.locations}
                    userLocation={userLocation ? {
                        lat: userLocation.coords.latitude,
                        lng: userLocation.coords.longitude
                    } : undefined}
                    className="h-48 w-full"
                    isLoaded={isLoaded}
                />
            </div>
        </div>
    );
} 