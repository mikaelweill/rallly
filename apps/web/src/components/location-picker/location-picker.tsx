import { Autocomplete, useLoadScript } from "@react-google-maps/api";
import { useCallback, useRef, useState } from "react";
import { Input } from "@rallly/ui/input";
import { Button } from "@rallly/ui/button";
import { FormItem, FormLabel } from "@rallly/ui/form";
import { useTranslation } from "next-i18next";
import { Trans } from "@/components/trans";
import { LocationMap } from "@/components/location-map";

const libraries: ["places"] = ["places"];

interface LocationPickerProps {
    value?: string;
    onChange?: (location: string) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
    const { t } = useTranslation();
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });

    const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete;
    }, []);

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
                                // If it's a business/POI and has a name, include it in the location string
                                if (place.name && !locationString.startsWith(place.name)) {
                                    locationString = `${place.name}, ${locationString}`;
                                }
                                onChange?.(locationString);
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
                            defaultValue={value}
                            onFocus={(e) => e.target.select()}
                        />
                    </Autocomplete>
                    {value && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                onChange?.("");
                                setSelectedPlace(null);
                                if (inputRef.current) {
                                    inputRef.current.value = "";
                                }
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </FormItem>
            <div className="relative h-[300px] w-full rounded-lg border">
                <LocationMap
                    address={value ?? ""}
                    className="h-full w-full"
                    interactive={true}
                    onLocationChange={(newAddress) => {
                        onChange?.(newAddress);
                        if (inputRef.current) {
                            inputRef.current.value = newAddress;
                        }
                    }}
                    isLoaded={isLoaded}
                />
            </div>
        </div>
    );
} 