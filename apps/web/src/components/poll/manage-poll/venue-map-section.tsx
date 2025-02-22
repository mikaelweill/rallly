import { VenueMap } from "./venue-map";

interface VenueMapSectionProps {
    venues: Array<{
        placeId: string;
        name: string;
        address: string;
        lat?: number;
        lng?: number;
    }>;
}

export function VenueMapSection({ venues }: VenueMapSectionProps) {
    return (
        <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-4 font-medium">Location Map</h3>
            <VenueMap
                venues={venues}
                className="h-[300px] w-full rounded-lg"
            />
        </div>
    );
} 