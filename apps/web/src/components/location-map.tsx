import { GoogleMap, Marker } from "@react-google-maps/api";
import { useMemo, useCallback, useEffect, useState, useRef } from "react";

interface Location {
    address: string;
    placeId?: string;
    lat?: number;
    lng?: number;
}

interface LocationMapProps {
    address: string;
    locations?: Location[];
    className?: string;
    interactive?: boolean;
    onLocationChange?: (address: string, latLng: { lat: number; lng: number }) => void;
    isLoaded: boolean;
}

export function LocationMap({
    address,
    locations = [],
    className,
    interactive = false,
    onLocationChange,
    isLoaded
}: LocationMapProps) {
    const geocoder = useMemo(() => isLoaded ? new google.maps.Geocoder() : null, [isLoaded]);
    const mapRef = useRef<google.maps.Map | null>(null);
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

                // If it's a POI, try to get the place name from the address components
                const placeName = result.address_components?.find(
                    component => component.types.includes('point_of_interest') || component.types.includes('establishment')
                )?.long_name;

                if (isPOI && placeName && !locationString.startsWith(placeName)) {
                    locationString = `${placeName}, ${locationString}`;
                }

                onLocationChange?.(locationString, { lat: latLng.lat(), lng: latLng.lng() });
            }
        });
    }, [geocoder, onLocationChange]);

    const fitBoundsToLocations = useCallback(() => {
        if (!mapRef.current || !isLoaded) return;

        const bounds = new google.maps.LatLngBounds();
        let hasValidPoints = false;

        // Add all location points to bounds
        locations.forEach(location => {
            if (location.lat && location.lng) {
                bounds.extend({ lat: location.lat, lng: location.lng });
                hasValidPoints = true;
            }
        });

        // If we have a current address location, include it too
        if (hasLocation) {
            bounds.extend(center);
            hasValidPoints = true;
        }

        if (hasValidPoints) {
            // Add padding to the bounds
            const padding = {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50
            };

            mapRef.current.fitBounds(bounds, padding);

            // Get the zoom level after fitting bounds
            const zoom = mapRef.current.getZoom();

            // If we have multiple locations and the zoom is too high, adjust it
            if (zoom !== undefined) {
                if (locations.length > 1) {
                    // Calculate the distance between the bounds corners
                    const ne = bounds.getNorthEast();
                    const sw = bounds.getSouthWest();

                    try {
                        const distance = google.maps.geometry?.spherical?.computeDistanceBetween(ne, sw);

                        // Adjust zoom based on distance
                        if (distance && distance > 1000000) { // More than 1000km
                            mapRef.current.setZoom(4);
                        } else if (distance && distance > 100000) { // More than 100km
                            mapRef.current.setZoom(6);
                        } else if (distance && distance > 10000) { // More than 10km
                            mapRef.current.setZoom(8);
                        } else if (zoom > 16) {
                            mapRef.current.setZoom(16);
                        }
                    } catch (error) {
                        // If we can't calculate the distance, use a simpler approach
                        // based on the number of locations
                        if (locations.length > 5) {
                            mapRef.current.setZoom(4);
                        } else if (locations.length > 2) {
                            mapRef.current.setZoom(6);
                        } else if (zoom > 16) {
                            mapRef.current.setZoom(16);
                        }
                    }
                } else if (zoom > 18) {
                    mapRef.current.setZoom(18);
                }
            }
        }
    }, [locations, hasLocation, center, isLoaded]);

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

    useEffect(() => {
        fitBoundsToLocations();
    }, [fitBoundsToLocations]);

    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        minZoom: 1, // Allow maximum zoom out
        maxZoom: 18,
        gestureHandling: 'greedy', // Makes it easier to move the map
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
                onLoad={(map) => {
                    mapRef.current = map;
                    fitBoundsToLocations();
                }}
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
                {locations.map((location, index) => (
                    location.lat && location.lng ? (
                        <Marker
                            key={location.placeId ?? index}
                            position={{ lat: location.lat, lng: location.lng }}
                            label={(index + 1).toString()}
                        />
                    ) : null
                ))}
            </GoogleMap>
        </div>
    );
} 