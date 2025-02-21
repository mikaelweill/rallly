import type { Participant } from "@rallly/database";

export type VoteType = "yes" | "maybe" | "no";
export type TransportMode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

interface ParticipantLocation {
    latitude: number;
    longitude: number;
    address: string;
    transportMode: TransportMode;
}

interface WeightedParticipant {
    id: string;
    name: string;
    weight: number;
    location: ParticipantLocation;
}

interface VenuePreferences {
    venueType: string;
    minRating?: number;
    priceLevel?: number; // 1-4
}

interface Coordinates {
    lat: number;
    lng: number;
}

export class VenueOptimizer {
    constructor(
        private participants: Participant[],
        private selectedDateId: string,
        private venuePreferences: VenuePreferences,
    ) { }

    /**
     * Calculate participant weights based on their votes for the selected date
     */
    private calculateWeights(): WeightedParticipant[] {
        return this.participants
            .filter((p) => p.startLocation) // Only include participants with locations
            .map((participant) => {
                // Get the vote for the selected date
                const vote = participant.votes?.find(
                    (v) => v.optionId === this.selectedDateId,
                );

                // Calculate weight based on vote
                let weight = 0;
                if (vote) {
                    switch (vote.type) {
                        case "yes":
                            weight = 1.0;
                            break;
                        case "maybe":
                            weight = 0.5;
                            break;
                        default:
                            weight = 0;
                    }
                }

                return {
                    id: participant.id,
                    name: participant.name,
                    weight,
                    location: {
                        latitude: participant.startLocation!.latitude,
                        longitude: participant.startLocation!.longitude,
                        address: participant.startLocation!.address,
                        transportMode: (participant.startLocation!.transportMode as TransportMode) || "DRIVING",
                    },
                };
            });
    }

    /**
     * Calculate the weighted centroid of all participant locations
     */
    private calculateWeightedCentroid(weightedParticipants: WeightedParticipant[]): Coordinates {
        let totalWeight = 0;
        let weightedLat = 0;
        let weightedLng = 0;

        weightedParticipants.forEach((p) => {
            totalWeight += p.weight;
            weightedLat += p.weight * p.location.latitude;
            weightedLng += p.weight * p.location.longitude;
        });

        // If no weights (everyone voted no), use simple average
        if (totalWeight === 0) {
            return {
                lat: weightedParticipants.reduce((sum, p) => sum + p.location.latitude, 0) / weightedParticipants.length,
                lng: weightedParticipants.reduce((sum, p) => sum + p.location.longitude, 0) / weightedParticipants.length,
            };
        }

        return {
            lat: weightedLat / totalWeight,
            lng: weightedLng / totalWeight,
        };
    }

    /**
     * Calculate search radius based on participant spread
     */
    private calculateSearchRadius(weightedParticipants: WeightedParticipant[], centroid: Coordinates): number {
        // Calculate the maximum distance from centroid to any participant
        const maxDistance = Math.max(
            ...weightedParticipants.map((p) => {
                const dlat = p.location.latitude - centroid.lat;
                const dlng = p.location.longitude - centroid.lng;
                return Math.sqrt(dlat * dlat + dlng * dlng) * 111000; // Convert to meters (rough approximation)
            }),
        );

        // Use max distance as radius, with a minimum of 1000m and maximum of 5000m
        return Math.min(Math.max(maxDistance, 1000), 5000);
    }

    /**
     * Initial venue search based on weighted participant locations
     */
    async searchVenues() {
        const weightedParticipants = this.calculateWeights();

        // Only proceed if we have participants with locations
        if (weightedParticipants.length === 0) {
            return {
                error: "No participants with locations found",
                weightedParticipants: [],
                centroid: null,
                venues: [],
            };
        }

        const centroid = this.calculateWeightedCentroid(weightedParticipants);
        const radius = this.calculateSearchRadius(weightedParticipants, centroid);

        // For now, just return the calculation results
        // We'll add actual venue search in the next iteration
        return {
            weightedParticipants,
            centroid,
            searchRadius: radius,
            venues: [], // Will be populated in next iteration
        };
    }
} 