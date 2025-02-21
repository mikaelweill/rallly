import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useMemo, useCallback, useEffect, useState, useRef } from "react";

export interface Location {
    id: string;
    address: string;
    placeId?: string;
    lat?: number;
    lng?: number;
    label?: string;
}

interface LocationMapProps {
    address: string;
    locations?: Location[];
    className?: string;
    interactive?: boolean;
    onLocationChange?: (address: string, latLng: { lat: number; lng: number }) => void;
    isLoaded: boolean;
    userLocation?: { lat: number; lng: number };
    tempLocation?: { lat: number; lng: number } | null;
    directions?: google.maps.DirectionsResult | null;
    selectedLocationId?: string | null;
    onMarkerClick?: (location: Location) => void;
    showUserLocationAsDot?: boolean;
}

export function LocationMap({
    address,
    locations = [],
    className,
    interactive = false,
    onLocationChange,
    isLoaded,
    userLocation,
    tempLocation,
    directions,
    selectedLocationId,
    onMarkerClick,
    showUserLocationAsDot = false,
}: LocationMapProps) {
    const geocoder = useMemo(() => isLoaded ? new google.maps.Geocoder() : null, [isLoaded]);
    const mapRef = useRef<google.maps.Map | null>(null);
    const [center, setCenter] = useState<google.maps.LatLngLiteral>({
        lat: 30.2672,
        lng: -97.7431
    });
    const [hasLocation, setHasLocation] = useState(false);
    const [localDirections, setLocalDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [animatingMarkers, setAnimatingMarkers] = useState<Set<string>>(new Set());

    const updateLocationFromLatLng = useCallback((latLng: google.maps.LatLng) => {
        if (!geocoder) return;

        geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === "OK" && results?.[0]) {
                const result = results[0];
                const isPOI = result.types?.some(type =>
                    ['point_of_interest', 'establishment'].includes(type)
                );

                let locationString = result.formatted_address;

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

        locations.forEach(location => {
            if (location.lat && location.lng) {
                bounds.extend({ lat: location.lat, lng: location.lng });
                hasValidPoints = true;
            }
        });

        if (userLocation) {
            bounds.extend(userLocation);
            hasValidPoints = true;
        }

        if (hasValidPoints) {
            mapRef.current.fitBounds(bounds);
            const currentZoom = mapRef.current.getZoom();
            if (currentZoom && currentZoom > 15) {
                mapRef.current.setZoom(15);
            }
        }
    }, [locations, userLocation, isLoaded]);

    const calculateRoute = useCallback(async (location: Location) => {
        if (!userLocation || !location.lat || !location.lng || !isLoaded) {
            console.log('Cannot calculate route:', { userLocation, location, isLoaded });
            return;
        }

        const directionsService = new google.maps.DirectionsService();
        try {
            console.log('Calculating route from', userLocation, 'to', location);
            const result = await directionsService.route({
                origin: new google.maps.LatLng(userLocation.lat, userLocation.lng),
                destination: new google.maps.LatLng(location.lat, location.lng),
                travelMode: google.maps.TravelMode.DRIVING,
            });
            console.log('Route result:', result);
            setLocalDirections(result);
        } catch (error) {
            console.error("Error calculating route:", error);
        }
    }, [userLocation, isLoaded]);

    const handleMarkerClick = useCallback((location: Location) => {
        console.log('Marker clicked:', location);
        if (onMarkerClick) {
            setAnimatingMarkers(new Set([location.id]));
            setTimeout(() => {
                setAnimatingMarkers(new Set());
            }, 1500);
            onMarkerClick(location);
        } else if (userLocation) {
            calculateRoute(location);
        }
    }, [onMarkerClick, userLocation, calculateRoute]);

    useEffect(() => {
        if (geocoder && address && locations.length > 0) {
            const firstLocation = locations[0];
            if (firstLocation.lat && firstLocation.lng) {
                setCenter({ lat: firstLocation.lat, lng: firstLocation.lng });
            }
        }
    }, [geocoder, address, locations]);

    useEffect(() => {
        fitBoundsToLocations();
    }, [fitBoundsToLocations, userLocation, directions]);

    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        minZoom: 1,
        maxZoom: 18,
        gestureHandling: 'greedy',
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
                {locations.map((location, index) => (
                    location.lat && location.lng ? (
                        <Marker
                            key={location.id}
                            position={{ lat: location.lat, lng: location.lng }}
                            label={{
                                text: location.label ?? `${index + 1}`,
                                color: 'white',
                                fontFamily: 'system-ui',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                            animation={animatingMarkers.has(location.id) ? google.maps.Animation.BOUNCE : undefined}
                            onClick={() => handleMarkerClick(location)}
                        />
                    ) : null
                ))}
                {tempLocation && !userLocation && (
                    <Marker
                        position={tempLocation}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#EF4444",
                            fillOpacity: 0.6,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                        }}
                    />
                )}
                {userLocation && !interactive && (
                    <Marker
                        position={userLocation}
                        icon={showUserLocationAsDot ? {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#4285F4", // Google Maps blue
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                        } : undefined}
                        label={!showUserLocationAsDot ? {
                            text: `${locations.length + 1}`,
                            color: 'white',
                            fontFamily: 'system-ui',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        } : undefined}
                    />
                )}
                {(directions || localDirections) && (
                    <DirectionsRenderer
                        directions={directions || localDirections || undefined}
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