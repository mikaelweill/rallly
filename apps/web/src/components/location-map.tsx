import { GoogleMap, Marker } from "@react-google-maps/api";
import { useMemo, useCallback, useEffect, useState } from "react";

interface LocationMapProps {
    address: string;
    className?: string;
    interactive?: boolean;
    onLocationChange?: (address: string) => void;
    isLoaded: boolean;
}

export function LocationMap({
    address,
    className,
    interactive = false,
    onLocationChange,
    isLoaded
}: LocationMapProps) {
    const geocoder = useMemo(() => isLoaded ? new google.maps.Geocoder() : null, [isLoaded]);
    const [center, setCenter] = useState<google.maps.LatLngLiteral>({
        lat: 30.2672,  // Downtown Austin coordinates
        lng: -97.7431
    });
    const [hasLocation, setHasLocation] = useState(false);

    const updateLocationFromLatLng = useCallback((latLng: google.maps.LatLng) => {
        if (!geocoder) return;

        geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === "OK" && results?.[0]) {
                const result = results[0];
                // Check if it's a business/POI by looking for point_of_interest or establishment types
                const isPOI = result.types?.some(type =>
                    ['point_of_interest', 'establishment'].includes(type)
                );

                let locationString = result.formatted_address;

                // If it's a POI and has a name, include it in the location string
                if (isPOI && result.name && !locationString.startsWith(result.name)) {
                    locationString = `${result.name}, ${locationString}`;
                }

                onLocationChange?.(locationString);
            }
        });
    }, [geocoder, onLocationChange]);

    useEffect(() => {
        if (geocoder && address) {
            geocoder.geocode({ address }, (results, status) => {
                if (status === "OK" && results?.[0]?.geometry?.location) {
                    const location = results[0].geometry.location;
                    setCenter({
                        lat: location.lat(),
                        lng: location.lng()
                    });
                    setHasLocation(true);
                }
            });
        }
    }, [geocoder, address]);

    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
    }), []);

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <div className={className}>
            <GoogleMap
                mapContainerClassName="w-full h-full rounded-lg"
                center={center}
                zoom={15}
                options={mapOptions}
                onClick={interactive ? (e) => {
                    if (e.latLng) {
                        setCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                        updateLocationFromLatLng(e.latLng);
                    }
                } : undefined}
            >
                {hasLocation && (
                    <Marker
                        position={center}
                        draggable={interactive}
                        onDragEnd={interactive ? (e) => {
                            if (e.latLng) {
                                setCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                                updateLocationFromLatLng(e.latLng);
                            }
                        } : undefined}
                    />
                )}
            </GoogleMap>
        </div>
    );
} 