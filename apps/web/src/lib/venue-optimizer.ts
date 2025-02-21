import { type VoteType } from "@prisma/client";

interface Location {
    lat: number;
    lng: number;
}

interface Participant {
    id: string;
    startLocation: Location;
    voteForSelectedDate: VoteType;
    transportMode?: "driving" | "transit" | "walking" | "bicycling";
}

interface VenuePreferences {
    type?: string[];      // e.g., ["restaurant", "cafe"]
    minRating?: number;   // 1-5
    maxPrice?: number;    // 1-4
    radius?: number;      // in meters
}

interface VenueScore {
    placeId: string;
    name: string;
    address: string;
    location: Location;
    rating?: number;
    priceLevel?: number;
    metrics: {
        min: number;
        max: number;
        avg: number;
        weighted: number;
    };
}

export class VenueOptimizer {
    private participants: Participant[];
    private selectedDate: string;
    private preferences: VenuePreferences;
    private placesService?: google.maps.places.PlacesService;

    constructor(
        participants: Participant[],
        selectedDate: string,
        preferences: VenuePreferences = {},
        map?: google.maps.Map
    ) {
        this.participants = participants;
        this.selectedDate = selectedDate;
        this.preferences = preferences;

        if (map) {
            this.placesService = new google.maps.places.PlacesService(map);
        }
    }

    private getParticipantWeight(vote: VoteType): number {
        switch (vote) {
            case "yes":
                return 1.0;
            case "ifNeedBe":
                return 0.5;
            case "no":
            default:
                return 0.0;
        }
    }

    private calculateWeightedCentroid(): Location {
        let totalWeight = 0;
        let weightedLat = 0;
        let weightedLng = 0;

        this.participants.forEach((participant) => {
            const weight = this.getParticipantWeight(participant.voteForSelectedDate);
            totalWeight += weight;
            weightedLat += participant.startLocation.lat * weight;
            weightedLng += participant.startLocation.lng * weight;
        });

        // If no one can attend (totalWeight = 0), use simple average
        if (totalWeight === 0) {
            const count = this.participants.length;
            return {
                lat: weightedLat / count,
                lng: weightedLng / count,
            };
        }

        return {
            lat: weightedLat / totalWeight,
            lng: weightedLng / totalWeight,
        };
    }

    private async searchVenues(center: Location): Promise<google.maps.places.PlaceResult[]> {
        if (!this.placesService) {
            throw new Error("Places service not initialized");
        }

        return new Promise((resolve, reject) => {
            // Note: When using rankBy=DISTANCE, radius is not allowed
            const request: google.maps.places.PlaceSearchRequest = {
                location: new google.maps.LatLng(center.lat, center.lng),
                type: this.preferences.type?.[0] || "restaurant",
                // Either use radius with default ranking
                ...(this.preferences.radius ? {
                    radius: this.preferences.radius
                } : {
                    // Or rank by distance (which doesn't allow radius)
                    rankBy: google.maps.places.RankBy.DISTANCE
                })
            };

            this.placesService!.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    // Filter by our additional preferences after the search
                    const filtered = results.filter((place) => {
                        // Filter by rating if specified
                        if (this.preferences.minRating && place.rating &&
                            place.rating < this.preferences.minRating) {
                            return false;
                        }
                        // Filter by price level if specified
                        if (this.preferences.maxPrice && place.price_level &&
                            place.price_level > this.preferences.maxPrice) {
                            return false;
                        }
                        return true;
                    });

                    // Limit to top 20 results
                    resolve(filtered.slice(0, 20));
                } else {
                    reject(new Error(`Places search failed: ${status}`));
                }
            });
        });
    }

    private async calculateDistanceMetrics(
        venue: google.maps.places.PlaceResult
    ): Promise<VenueScore> {
        const venueLoc = venue.geometry?.location;
        if (!venueLoc) {
            throw new Error("Venue location not found");
        }

        const distances = this.participants.map((participant) => {
            const weight = this.getParticipantWeight(participant.voteForSelectedDate);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(participant.startLocation.lat, participant.startLocation.lng),
                venueLoc
            );
            return { distance, weight };
        });

        const validDistances = distances.filter(d => d.weight > 0);
        const weightedSum = distances.reduce((sum, d) => sum + d.distance * d.weight, 0);
        const totalWeight = distances.reduce((sum, d) => sum + d.weight, 0);

        return {
            placeId: venue.place_id!,
            name: venue.name!,
            address: venue.vicinity!,
            location: {
                lat: venueLoc.lat(),
                lng: venueLoc.lng(),
            },
            rating: venue.rating,
            priceLevel: venue.price_level,
            metrics: {
                min: Math.min(...validDistances.map(d => d.distance)),
                max: Math.max(...validDistances.map(d => d.distance)),
                avg: validDistances.reduce((sum, d) => sum + d.distance, 0) / validDistances.length,
                weighted: totalWeight > 0 ? weightedSum / totalWeight : 0,
            },
        };
    }

    private async calculateETAMetrics(
        venue: google.maps.places.PlaceResult
    ): Promise<VenueScore> {
        const venueLoc = venue.geometry?.location;
        if (!venueLoc) {
            throw new Error("Venue location not found");
        }

        const service = new google.maps.DistanceMatrixService();

        const destinations = [venueLoc];
        const origins = this.participants.map(p =>
            new google.maps.LatLng(p.startLocation.lat, p.startLocation.lng)
        );

        const response = await service.getDistanceMatrix({
            origins,
            destinations,
            travelMode: google.maps.TravelMode.DRIVING, // Default to driving
            drivingOptions: {
                departureTime: new Date(), // Current time
                trafficModel: google.maps.TrafficModel.BEST_GUESS,
            },
        });

        const durations = response.rows.map((row, i) => ({
            duration: row.elements[0].duration.value,
            weight: this.getParticipantWeight(this.participants[i].voteForSelectedDate),
        }));

        const validDurations = durations.filter(d => d.weight > 0);
        const weightedSum = durations.reduce((sum, d) => sum + d.duration * d.weight, 0);
        const totalWeight = durations.reduce((sum, d) => sum + d.weight, 0);

        return {
            placeId: venue.place_id!,
            name: venue.name!,
            address: venue.vicinity!,
            location: {
                lat: venueLoc.lat(),
                lng: venueLoc.lng(),
            },
            rating: venue.rating,
            priceLevel: venue.price_level,
            metrics: {
                min: Math.min(...validDurations.map(d => d.duration)),
                max: Math.max(...validDurations.map(d => d.duration)),
                avg: validDurations.reduce((sum, d) => sum + d.duration, 0) / validDurations.length,
                weighted: totalWeight > 0 ? weightedSum / totalWeight : 0,
            },
        };
    }

    async optimizeByDistance(): Promise<VenueScore[]> {
        const centroid = this.calculateWeightedCentroid();
        const venues = await this.searchVenues(centroid);

        const venueScores = await Promise.all(
            venues.map(venue => this.calculateDistanceMetrics(venue))
        );

        // Sort by weighted distance (lower is better)
        return venueScores.sort((a, b) => a.metrics.weighted - b.metrics.weighted);
    }

    async optimizeByETA(): Promise<VenueScore[]> {
        const centroid = this.calculateWeightedCentroid();
        const venues = await this.searchVenues(centroid);

        const venueScores = await Promise.all(
            venues.map(venue => this.calculateETAMetrics(venue))
        );

        // Sort by weighted ETA (lower is better)
        return venueScores.sort((a, b) => a.metrics.weighted - b.metrics.weighted);
    }
} 