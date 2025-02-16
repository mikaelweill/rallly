import { useLoadScript, GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@rallly/ui/input";
import { Button } from "@rallly/ui/button";
import { FormField, FormItem, FormLabel } from "@rallly/ui/form";
import { useTranslation } from "next-i18next";
import { Trans } from "@/components/trans";
import { MapPinIcon } from "lucide-react";

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

interface LocationPickerProps {
    value?: string;
    onChange?: (location: string) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
    const { t } = useTranslation();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [center, setCenter] = useState<google.maps.LatLngLiteral>({
        lat: 40.7128,
        lng: -74.0060
    });
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
        geocoderRef.current = new google.maps.Geocoder();
    }, []);

    const onMarkerLoad = useCallback((marker: google.maps.Marker) => {
        markerRef.current = marker;
    }, []);

    const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete;
    }, []);

    const updateLocationFromLatLng = useCallback((latLng: google.maps.LatLng) => {
        if (!geocoderRef.current) return;

        geocoderRef.current.geocode({ location: latLng }, (results, status) => {
            if (status === "OK" && results?.[0]) {
                const address = results[0].formatted_address;
                onChange?.(address);
                if (inputRef.current) {
                    inputRef.current.value = address;
                }
            }
        });
    }, [onChange]);

    const onMarkerDragEnd = useCallback(() => {
        const position = markerRef.current?.getPosition();
        if (position) {
            setCenter({ lat: position.lat(), lng: position.lng() });
            updateLocationFromLatLng(position);
        }
    }, [updateLocationFromLatLng]);

    useEffect(() => {
        if (!autocompleteRef.current) return;

        const listener = autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current?.getPlace();
            if (!place?.geometry?.location) return;

            setSelectedPlace(place);
            const newCenter = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            };
            setCenter(newCenter);
            map?.setCenter(newCenter);
            map?.setZoom(17);

            if (place.formatted_address) {
                onChange?.(place.formatted_address);
            }
        });

        return () => {
            google.maps.event.removeListener(listener);
        };
    }, [map, onChange]);

    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
    }), []);

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
                <div className="flex gap-2">
                    <Autocomplete
                        onLoad={onAutocompleteLoad}
                        onPlaceChanged={() => {
                            const place = autocompleteRef.current?.getPlace();
                            if (!place?.geometry?.location) return;

                            setSelectedPlace(place);
                            const newCenter = {
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            };
                            setCenter(newCenter);
                            map?.setCenter(newCenter);
                            map?.setZoom(17);

                            if (place.formatted_address) {
                                onChange?.(place.formatted_address);
                            }
                        }}
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
                <GoogleMap
                    mapContainerClassName="w-full h-full rounded-lg"
                    center={center}
                    zoom={12}
                    onLoad={onLoad}
                    options={mapOptions}
                    onClick={(e) => {
                        if (e.latLng) {
                            setCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                            updateLocationFromLatLng(e.latLng);
                        }
                    }}
                >
                    {(selectedPlace?.geometry?.location || value) && (
                        <Marker
                            position={center}
                            draggable={true}
                            onLoad={onMarkerLoad}
                            onDragEnd={onMarkerDragEnd}
                        />
                    )}
                </GoogleMap>
            </div>
        </div>
    );
} 