import { Autocomplete, useLoadScript } from "@react-google-maps/api";
import { useCallback, useRef, useState } from "react";
import { Input } from "@rallly/ui/input";
import { Button } from "@rallly/ui/button";
import { FormItem, FormLabel } from "@rallly/ui/form";
import { useTranslation } from "next-i18next";
import { Trans } from "@/components/trans";
import { LocationMap } from "@/components/location-map";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

interface Location {
    address: string;
    placeId?: string;
    lat?: number;
    lng?: number;
}

interface LocationPickerProps {
    value?: string;
    onChange?: (location: string) => void;
    onLocationsChange?: (locations: Location[]) => void;
    multipleLocations?: boolean;
}

export function LocationPicker({ value, onChange, onLocationsChange, multipleLocations = false }: LocationPickerProps) {
    const { t } = useTranslation();
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [currentAddress, setCurrentAddress] = useState<string>(value ?? "");
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });

    const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete;
    }, []);

    const addLocation = useCallback(() => {
        if (!selectedPlace || !selectedPlace.formatted_address) return;

        const newLocation: Location = {
            address: selectedPlace.formatted_address,
            placeId: selectedPlace.place_id,
            lat: selectedPlace.geometry?.location?.lat(),
            lng: selectedPlace.geometry?.location?.lng(),
        };

        if (multipleLocations) {
            const newLocations = [...locations, newLocation];
            setLocations(newLocations);
            onLocationsChange?.(newLocations);
            // Clear the input and selected place
            setCurrentAddress("");
            setSelectedPlace(null);
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        } else {
            onChange?.(newLocation.address);
        }
    }, [selectedPlace, multipleLocations, locations, onChange, onLocationsChange]);

    const removeLocation = useCallback((index: number) => {
        const newLocations = locations.filter((_, i) => i !== index);
        setLocations(newLocations);
        onLocationsChange?.(newLocations);
    }, [locations, onLocationsChange]);

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-4">
            <FormItem>
                <div>
                    <FormLabel className="inline-block" htmlFor="location">
                        {t("location")}
                    </FormLabel>
                    <span className="text-muted-foreground ml-1 text-sm">
                        <Trans i18nKey="optionalLabel" defaults="(Optional)" />
                    </span>
                </div>
                <div className="flex gap-2 w-full">
                    <Autocomplete
                        onLoad={onAutocompleteLoad}
                        onPlaceChanged={() => {
                            const place = autocompleteRef.current?.getPlace();
                            if (!place?.geometry?.location) return;

                            setSelectedPlace(place);
                            if (place.formatted_address) {
                                let locationString = place.formatted_address;
                                if (place.name && !locationString.startsWith(place.name)) {
                                    locationString = `${place.name}, ${locationString}`;
                                }
                                setCurrentAddress(locationString);
                                if (!multipleLocations) {
                                    onChange?.(locationString);
                                }
                            }
                        }}
                        className="flex-1"
                    >
                        <Input
                            ref={inputRef}
                            type="text"
                            id="location"
                            className="w-full"
                            placeholder={t("locationPlaceholder")}
                            value={currentAddress}
                            onChange={(e) => setCurrentAddress(e.target.value)}
                            onFocus={(e) => e.target.select()}
                        />
                    </Autocomplete>
                    {multipleLocations && selectedPlace && (
                        <Button
                            variant="secondary"
                            onClick={addLocation}
                        >
                            Add
                        </Button>
                    )}
                    {!multipleLocations && currentAddress && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                onChange?.("");
                                setSelectedPlace(null);
                                setCurrentAddress("");
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </FormItem>
            {multipleLocations && locations.length > 0 && (
                <div className="space-y-2">
                    {locations.map((location, index) => (
                        <div key={location.placeId ?? index} className="flex items-center gap-2">
                            <div className="flex-1 p-2 bg-muted rounded-md">
                                {location.address}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLocation(index)}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            <div className="relative h-[300px] w-full rounded-lg border">
                <LocationMap
                    address={currentAddress}
                    locations={locations}
                    className="h-full w-full"
                    interactive={true}
                    onLocationChange={(newAddress) => {
                        setCurrentAddress(newAddress);
                        if (!multipleLocations) {
                            onChange?.(newAddress);
                        }
                    }}
                    isLoaded={isLoaded}
                />
            </div>
        </div>
    );
} 