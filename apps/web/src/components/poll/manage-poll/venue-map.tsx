import { useLoadScript } from "@react-google-maps/api";
import { LocationMap } from "@/components/location-map";
import { useParticipants } from "@/components/participants-provider";
import type { ParticipantWithStartLocation } from "@/types/participant";

interface VenueMapProps {
    venues: Array<{
        placeId: string;
        name: string;
        address: string;
        lat?: number;
        lng?: number;
    }>;
    className?: string;
}

export function VenueMap({ venues, className }: VenueMapProps) {
    const { participants } = useParticipants();
    const participantsWithLocation = (participants as ParticipantWithStartLocation[])
        .filter((p) => p.startLocation);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
        libraries: ["places"],
    });

    // Convert participants to Location type
    const participantLocations = participantsWithLocation.map((p, idx) => ({
        id: p.id,
        address: p.startLocation?.address ?? "",
        lat: p.startLocation?.latitude,
        lng: p.startLocation?.longitude,
        label: `${idx + 1}`,
    }));

    // Convert venues to Location type
    const venueLocations = venues.map((venue, idx) => ({
        id: venue.placeId,
        address: venue.address,
        lat: venue.lat,
        lng: venue.lng,
        label: String.fromCharCode(65 + idx), // A, B, C, etc.
    }));

    return (
        <LocationMap
            address=""
            locations={[...participantLocations, ...venueLocations]}
            className={className}
            isLoaded={isLoaded}
            interactive={false}
        />
    );
} 