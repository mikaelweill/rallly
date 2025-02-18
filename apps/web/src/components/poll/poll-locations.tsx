import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { MapPinIcon, NavigationIcon, CrosshairIcon, Maximize2Icon } from "lucide-react";
import { useLoadScript, Autocomplete, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { useState, useCallback } from "react";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Input } from "@rallly/ui/input";
import { Dialog, DialogContent } from "@rallly/ui/dialog";

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
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [startAddress, setStartAddress] = useState("");
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });

    if (!poll.locations || poll.locations.length === 0) {
        return null;
    }

    const handleUseCurrentLocation = async () => {
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });
            setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });

            // Get address from coordinates
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({
                location: { lat: position.coords.latitude, lng: position.coords.longitude }
            });
            if (result.results[0]) {
                setStartAddress(result.results[0].formatted_address);
            }
        } catch (error) {
            setError("Could not get your current location. Please enter an address manually.");
        }
    };

    const calculateRoute = useCallback(async (destination: { lat?: number; lng?: number }) => {
        if (!userLocation || !destination.lat || !destination.lng) return null;

        const directionsService = new google.maps.DirectionsService();
        try {
            const result = await directionsService.route({
                origin: userLocation,
                destination: { lat: destination.lat, lng: destination.lng },
                travelMode: google.maps.TravelMode.DRIVING,
            });
            return result;
        } catch (error) {
            console.error("Error calculating route:", error);
            return null;
        }
    }, [userLocation]);

    const handleCalculateDistances = async () => {
        if (!startAddress) {
            setError("Please enter a starting location or use your current location.");
            return;
        }

        setCalculating(true);
        setError(null);
        try {
            if (!window.google?.maps?.DistanceMatrixService) {
                throw new Error("Google Maps Distance Matrix service is not available");
            }

            const service = new google.maps.DistanceMatrixService();
            const result = await service.getDistanceMatrix({
                origins: [startAddress],
                destinations: poll.locations.map(loc => loc.address),
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
                } else {
                    setError("An error occurred while calculating distances. Please try again later.");
                }
            }
        } finally {
            setCalculating(false);
        }
    };

    const handleLocationClick = async (location: typeof poll.locations[0]) => {
        if (!userLocation || !location.lat || !location.lng) {
            setError("Please set a starting location first");
            return;
        }

        setSelectedLocationId(location.id);
        const route = await calculateRoute(location);
        if (route) {
            setDirections(route);
        }
    };

    return (
        <div className="rounded-lg border bg-white">
            <div className="space-y-2 p-4">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">Locations</h3>
                    <div className="flex gap-2">
                        {isLoaded && (
                            <Autocomplete
                                onLoad={setAutocomplete}
                                onPlaceChanged={() => {
                                    const place = autocomplete?.getPlace();
                                    if (place?.geometry?.location) {
                                        setUserLocation({
                                            lat: place.geometry.location.lat(),
                                            lng: place.geometry.location.lng()
                                        });
                                        setStartAddress(place.formatted_address ?? "");
                                    }
                                }}
                            >
                                <Input
                                    type="text"
                                    placeholder="Enter starting location..."
                                    value={startAddress}
                                    onChange={(e) => setStartAddress(e.target.value)}
                                    className="flex-1"
                                />
                            </Autocomplete>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUseCurrentLocation}
                        >
                            <Icon>
                                <CrosshairIcon className="mr-2 h-4 w-4" />
                            </Icon>
                            Current
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCalculateDistances}
                            disabled={calculating || !isLoaded || !startAddress}
                        >
                            <Icon>
                                <NavigationIcon className="mr-2 h-4 w-4" />
                            </Icon>
                            {calculating ? "Calculating..." : "Calculate"}
                        </Button>
                    </div>
                </div>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <div className="space-y-2">
                    {poll.locations.map((location, index) => (
                        <div
                            key={location.id}
                            className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleLocationClick(location)}
                        >
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
                <div className="relative">
                    <LocationMap
                        address={poll.locations[0].address}
                        locations={poll.locations}
                        userLocation={userLocation}
                        directions={directions}
                        selectedLocationId={selectedLocationId}
                        className="h-48 w-full"
                        isLoaded={isLoaded}
                        onMarkerClick={handleLocationClick}
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        className="absolute bottom-2 right-2 bg-white"
                        onClick={() => setIsMapModalOpen(true)}
                    >
                        <Icon>
                            <Maximize2Icon className="h-4 w-4" />
                        </Icon>
                    </Button>
                </div>
            </div>
            <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
                <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[90vh] w-[90vw] !max-w-none !p-0 !rounded-lg shadow-2xl">
                    <LocationMap
                        address={poll.locations[0].address}
                        locations={poll.locations}
                        userLocation={userLocation}
                        directions={directions}
                        selectedLocationId={selectedLocationId}
                        className="h-full w-full rounded-lg"
                        isLoaded={isLoaded}
                        onMarkerClick={handleLocationClick}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
} 