import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { MapPinIcon, NavigationIcon, CrosshairIcon, Maximize2Icon, Car, PersonStanding, Bike, Bus, Map, Star, DollarSign, XIcon } from "lucide-react";
import { useLoadScript, Autocomplete, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { useState, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Input } from "@rallly/ui/input";
import { Dialog, DialogContent } from "@rallly/ui/dialog";

import { LocationMap, type Location } from "@/components/location-map";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { usePoll } from "@/contexts/poll";
import { useTranslation } from "@/i18n/client";

const libraries: ["places"] = ["places"];

type DistanceInfo = {
    distance: string;
    duration: string;
};

type TransportMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

export function PollLocations() {
    const poll = usePoll();
    const { t } = useTranslation();
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [distances, setDistances] = useState<Record<string, DistanceInfo>>({});
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [startAddress, setStartAddress] = useState("");
    const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | undefined>(undefined);
    const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [transportMode, setTransportMode] = useState<TransportMode>('DRIVING');
    const [setLocations, setSetLocations] = useState<Array<{
        id: string;
        userName: string;
        address: string;
        location: { lat: number; lng: number };
    }>>([]);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });

    // Convert poll locations to Location type
    const pollLocations: Location[] = poll.locations?.map(loc => ({
        id: loc.id,
        address: loc.address,
        placeId: loc.placeId || undefined,
        lat: loc.lat || undefined,
        lng: loc.lng || undefined
    })) ?? [];

    if (!poll.isLocationOptimized && (!poll.locations || poll.locations.length === 0)) {
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
                setError(null);
            }
        } catch (error) {
            setError("Could not get your current location. Please enter an address manually.");
        }
    };

    const calculateRoute = useCallback(async (destination: { lat?: number | null; lng?: number | null }) => {
        if (!userLocation || !destination.lat || !destination.lng) return undefined;

        const directionsService = new google.maps.DirectionsService();
        try {
            const result = await directionsService.route({
                origin: userLocation,
                destination: { lat: destination.lat, lng: destination.lng },
                travelMode: google.maps.TravelMode[transportMode],
            });
            return result;
        } catch (error) {
            console.error("Error calculating route:", error);
            return undefined;
        }
    }, [userLocation, transportMode]);

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
                travelMode: google.maps.TravelMode[transportMode],
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

    const handleLocationClick = async (location: Location) => {
        if (!userLocation) {
            setError("Please set a starting location first");
            return;
        }

        if (!location.lat || !location.lng) {
            return;
        }

        setError(null);
        setSelectedLocationId(location.id);
        const route = await calculateRoute({
            lat: location.lat,
            lng: location.lng
        });
        if (route) {
            setDirections(route);
        }
    };

    return (
        <div className="rounded-lg border bg-white">
            <div className="space-y-2 p-4">
                {poll.isLocationOptimized ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium">Smart Location</h3>
                            <div className="flex items-center gap-2">
                                {poll.venuePreferences?.venueType && (
                                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                                        <Icon><MapPinIcon className="mr-1 h-3.5 w-3.5" /></Icon>
                                        {poll.venuePreferences.venueType}
                                    </div>
                                )}
                                {poll.venuePreferences?.priceLevel && (
                                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                                        <Icon><DollarSign className="mr-1 h-3.5 w-3.5" /></Icon>
                                        Price: {"$".repeat(poll.venuePreferences.priceLevel)}
                                    </div>
                                )}
                                {poll.venuePreferences?.minRating && (
                                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                                        <Icon><Star className="mr-1 h-3.5 w-3.5" /></Icon>
                                        {poll.venuePreferences.minRating}+ stars
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                            Once participants share their locations, optimal meeting spots will be suggested based on travel time and preferences.
                        </div>
                        {setLocations.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Participant Locations</h4>
                                {setLocations.map((loc, index) => (
                                    <div key={loc.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                            {index + 1}
                                        </span>
                                        <span>{loc.userName}</span>
                                        <span className="truncate">{loc.address}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                {isLoaded && (
                                    <div className="relative flex-1">
                                        <Autocomplete
                                            onLoad={setAutocomplete}
                                            onPlaceChanged={() => {
                                                const place = autocomplete?.getPlace();
                                                if (place?.geometry?.location) {
                                                    setStartAddress(place.formatted_address ?? "");
                                                    setUserLocation({
                                                        lat: place.geometry.location.lat(),
                                                        lng: place.geometry.location.lng()
                                                    });
                                                    setError(null);
                                                }
                                            }}
                                        >
                                            <Input
                                                type="text"
                                                placeholder="Enter your starting location..."
                                                value={startAddress}
                                                onChange={(e) => setStartAddress(e.target.value)}
                                                className="w-full pr-24"
                                                disabled={!!setLocations.find(loc => loc.userName === "You")}
                                            />
                                        </Autocomplete>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => {
                                                try {
                                                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                                                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                                                            enableHighAccuracy: true,
                                                            timeout: 5000,
                                                            maximumAge: 0
                                                        });
                                                    });

                                                    const newLocation = {
                                                        lat: position.coords.latitude,
                                                        lng: position.coords.longitude
                                                    };
                                                    setUserLocation(newLocation);

                                                    const geocoder = new google.maps.Geocoder();
                                                    const result = await geocoder.geocode({
                                                        location: newLocation
                                                    });
                                                    if (result.results[0]) {
                                                        setStartAddress(result.results[0].formatted_address);
                                                        setError(null);
                                                    }
                                                } catch (error) {
                                                    setError("Could not get your current location. Please enter an address manually.");
                                                }
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2"
                                            disabled={!!setLocations.find(loc => loc.userName === "You")}
                                        >
                                            <Icon>
                                                <CrosshairIcon className="h-4 w-4 text-muted-foreground" />
                                            </Icon>
                                        </Button>
                                    </div>
                                )}
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                        if (setLocations.find(loc => loc.userName === "You")) {
                                            // Clear the set location
                                            setSetLocations(prev => prev.filter(loc => loc.userName !== "You"));
                                            setUserLocation(undefined);
                                            setStartAddress("");
                                        } else if (userLocation && startAddress) {
                                            // Add to set locations
                                            setSetLocations(prev => [...prev, {
                                                id: Math.random().toString(),
                                                userName: "You", // This should come from user context
                                                address: startAddress,
                                                location: userLocation
                                            }]);
                                        }
                                    }}
                                    disabled={(!userLocation && !startAddress) && !setLocations.find(loc => loc.userName === "You")}
                                >
                                    {setLocations.find(loc => loc.userName === "You") ? (
                                        <>
                                            <Icon>
                                                <XIcon className="mr-2 h-4 w-4" />
                                            </Icon>
                                            Clear
                                        </>
                                    ) : (
                                        <>
                                            <Icon>
                                                <MapPinIcon className="mr-2 h-4 w-4" />
                                            </Icon>
                                            Set Location
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div className="relative">
                                <LocationMap
                                    address=""
                                    locations={setLocations.map((loc, index) => ({
                                        id: loc.id,
                                        address: loc.address,
                                        lat: loc.location.lat,
                                        lng: loc.location.lng
                                    }))}
                                    className="h-48 w-full"
                                    isLoaded={isLoaded}
                                    interactive={!setLocations.find(loc => loc.userName === "You")}
                                    userLocation={!setLocations.find(loc => loc.userName === "You") ? userLocation : undefined}
                                    tempLocation={!setLocations.find(loc => loc.userName === "You") && userLocation ? userLocation : undefined}
                                    onLocationChange={async (_, latLng) => {
                                        if (!setLocations.find(loc => loc.userName === "You")) {
                                            setUserLocation(latLng);
                                            const geocoder = new google.maps.Geocoder();
                                            const result = await geocoder.geocode({
                                                location: latLng
                                            });
                                            if (result.results[0]) {
                                                setStartAddress(result.results[0].formatted_address);
                                                setError(null);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">Locations</h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    {isLoaded && (
                                        <div className="relative flex-1">
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
                                                        setError(null);
                                                    }
                                                }}
                                            >
                                                <Input
                                                    type="text"
                                                    placeholder="Enter starting location..."
                                                    value={startAddress}
                                                    onChange={(e) => setStartAddress(e.target.value)}
                                                    className="w-full pr-24"
                                                />
                                            </Autocomplete>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleUseCurrentLocation}
                                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                            >
                                                <Icon>
                                                    <CrosshairIcon className="h-4 w-4 text-muted-foreground" />
                                                </Icon>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex gap-1 items-center rounded-md border bg-background p-1">
                                        <Button
                                            variant={transportMode === 'DRIVING' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setTransportMode('DRIVING')}
                                            className={`h-7 ${transportMode === 'DRIVING' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted'}`}
                                        >
                                            <Icon>
                                                <Car className="h-4 w-4" />
                                            </Icon>
                                        </Button>
                                        <Button
                                            variant={transportMode === 'WALKING' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setTransportMode('WALKING')}
                                            className={`h-7 ${transportMode === 'WALKING' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted'}`}
                                        >
                                            <Icon>
                                                <PersonStanding className="h-4 w-4" />
                                            </Icon>
                                        </Button>
                                        <Button
                                            variant={transportMode === 'BICYCLING' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setTransportMode('BICYCLING')}
                                            className={`h-7 ${transportMode === 'BICYCLING' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted'}`}
                                        >
                                            <Icon>
                                                <Bike className="h-4 w-4" />
                                            </Icon>
                                        </Button>
                                        <Button
                                            variant={transportMode === 'TRANSIT' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setTransportMode('TRANSIT')}
                                            className={`h-7 ${transportMode === 'TRANSIT' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted'}`}
                                        >
                                            <Icon>
                                                <Bus className="h-4 w-4" />
                                            </Icon>
                                        </Button>
                                    </div>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleCalculateDistances}
                                        disabled={calculating || !isLoaded || !startAddress}
                                        className="min-w-[100px]"
                                    >
                                        <Icon>
                                            <NavigationIcon className="mr-2 h-4 w-4" />
                                        </Icon>
                                        {calculating ? "Calculating..." : "Calculate"}
                                    </Button>
                                </div>
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
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm text-muted-foreground">
                                                <span className="mr-2">{distances[location.id].distance}</span>
                                                <span>({distances[location.id].duration})</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2"
                                                title="Open in Google Maps"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const baseUrl = "https://www.google.com/maps/dir/?api=1";
                                                    const origin = encodeURIComponent(startAddress);
                                                    const destination = encodeURIComponent(location.address);
                                                    const mode = transportMode.toLowerCase();
                                                    const url = `${baseUrl}&origin=${origin}&destination=${destination}&travelmode=${mode}`;
                                                    window.open(url, '_blank');
                                                }}
                                            >
                                                <Icon>
                                                    <Map className="h-4 w-4" />
                                                </Icon>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="relative">
                            <LocationMap
                                address={poll.locations[0]?.address}
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
                                variant="secondary"
                                className="absolute bottom-2 right-2 bg-white"
                                onClick={() => setIsMapModalOpen(true)}
                            >
                                <Icon>
                                    <Maximize2Icon className="h-4 w-4" />
                                </Icon>
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 