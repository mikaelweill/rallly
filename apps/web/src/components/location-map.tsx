import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useMemo, useCallback, useEffect, useState, useRef } from "react";

interface Location {
    id: string;
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
    userLocation?: { lat: number; lng: number };
    directions?: google.maps.DirectionsResult | null;
    selectedLocationId?: string | null;
}

export function LocationMap({
    address,
    locations = [],
    className,
    interactive = false,
    onLocationChange,
    isLoaded,
    userLocation,
    directions,
    selectedLocationId
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

        // Add user location if available
        if (userLocation) {
            bounds.extend(userLocation);
            hasValidPoints = true;
        }

        if (hasValidPoints) {
            mapRef.current.fitBounds(bounds, {
                padding: 50
            });
        }
    }, [locations, userLocation, isLoaded]);

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
    }, [fitBoundsToLocations, userLocation, directions]);

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
                        const lat = e.latLng.lat();
                        const lng = e.latLng.lng();
                        setCenter({ lat, lng });
                        onLocationChange?.(address, { lat, lng });
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
                            key={location.id}
                            position={{ lat: location.lat, lng: location.lng }}
                            label={(index + 1).toString()}
                            animation={selectedLocationId === location.id ? google.maps.Animation.BOUNCE : undefined}
                        />
                    ) : null
                ))}
                {userLocation && (
                    <Marker
                        position={userLocation}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#4F46E5",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                        }}
                    />
                )}
                {directions && (
                    <DirectionsRenderer
                        directions={directions}
                        options={{
                            suppressMarkers: true,
                            polylineOptions: {
                                strokeColor: "#4F46E5",
                                strokeWeight: 4,
                            },
                        }}
                    />
                )}
            </GoogleMap>
        </div>
    );
} 