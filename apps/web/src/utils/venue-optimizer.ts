/// <reference types="@types/google.maps" />
import { loadGoogleMapsScript } from "./google-maps";

type Location = {
    latitude: number;
    longitude: number;
    transportMode?: string;
};

type Participant = {
    location: Location;
    transportMode: string;
    responseWeight: number; // 0 for no, 0.5 for maybe, 1 for yes
};

type VenueMetrics = {
    minDistance?: number;
    maxDistance?: number;
    avgDistance?: number;
    minEta?: number;
    maxEta?: number;
    avgEta?: number;
};

type OptimizedVenue = {
    placeId: string;
    name: string;
    address: string;
    metrics: VenueMetrics;
};

export class VenueOptimizer {
    private participants: Participant[];
    private selectedDate: Date;
    private placesService: google.maps.places.PlacesService | null = null;
    private distanceMatrixService: google.maps.DistanceMatrixService | null = null;
    private preferences: {
        type?: string;
        minRating?: number;
        maxPrice?: number;
        radius?: number;
    };

    constructor(
        participants: Participant[],
        selectedDate: Date,
        preferences?: {
            type?: string;
            minRating?: number;
            maxPrice?: number;
            radius?: number;
        }
    ) {
        this.participants = participants;
        this.selectedDate = selectedDate;
        this.preferences = preferences || {};
    }

    private async initServices() {
        await loadGoogleMapsScript();
        const mapDiv = document.createElement("div");
        const map = new google.maps.Map(mapDiv, {
            center: { lat: 0, lng: 0 }, // Default center
            zoom: 2, // Default zoom
        });
        this.placesService = new google.maps.places.PlacesService(map);
        this.distanceMatrixService = new google.maps.DistanceMatrixService();
    }

    private calculateCentroid(): { lat: number; lng: number } {
        const totalLat = this.participants.reduce((sum, p) => sum + p.location.latitude, 0);
        const totalLng = this.participants.reduce((sum, p) => sum + p.location.longitude, 0);
        return {
            lat: totalLat / this.participants.length,
            lng: totalLng / this.participants.length,
        };
    }

    private async searchVenues(centroid: { lat: number; lng: number }, optimizationType: "eta" | "distance"): Promise<google.maps.places.PlaceResult[]> {
        if (!this.placesService) {
            await this.initServices();
            if (!this.placesService) {
                throw new Error("Places service not initialized");
            }
        }

        return new Promise((resolve, reject) => {
            const request: google.maps.places.PlaceSearchRequest = {
                location: new google.maps.LatLng(centroid.lat, centroid.lng),
                type: this.preferences.type || "restaurant",
                // For distance optimization, rank by distance. For ETA, use radius to get all venues within range
                ...(optimizationType === "distance"
                    ? { rankBy: google.maps.places.RankBy.DISTANCE }
                    : { radius: 3000 }) // 3km radius for ETA optimization
            };

            this.placesService!.nearbySearch(request, async (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    // Filter results by rating and price level
                    const filtered = results.filter(place => {
                        if (this.preferences.minRating && place.rating) {
                            if (place.rating < this.preferences.minRating) {
                                return false;
                            }
                        }
                        if (this.preferences.maxPrice && place.price_level) {
                            if (place.price_level > this.preferences.maxPrice) {
                                return false;
                            }
                        }
                        return true;
                    });

                    if (optimizationType === "distance") {
                        // For distance, we already have them sorted, just take top 3
                        resolve(filtered.slice(0, 3));
                    } else {
                        // For ETA, we'll calculate ETAs for all venues within radius and sort later
                        resolve(filtered);
                    }
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    resolve([]);
                } else {
                    reject(new Error(`Places search failed: ${status}`));
                }
            });
        });
    }

    private formatNumber(value: number): number {
        return Number(value.toFixed(2));
    }

    private async calculateMetrics(
        venue: google.maps.places.PlaceResult,
        optimizationType: "eta" | "distance",
    ): Promise<VenueMetrics> {
        if (!this.distanceMatrixService || !venue.geometry?.location) {
            throw new Error("Distance Matrix service not initialized or invalid venue");
        }

        const request = {
            origins: this.participants.map(p => ({
                lat: p.location.latitude,
                lng: p.location.longitude
            })),
            destinations: [venue.geometry.location],
            travelMode: google.maps.TravelMode.DRIVING,
            drivingOptions: {
                departureTime: this.selectedDate,
            },
        };

        const response = await this.distanceMatrixService.getDistanceMatrix(request);

        if (!response.rows.length) {
            throw new Error("No results from Distance Matrix");
        }

        const metrics: VenueMetrics = {};
        const values = response.rows.map(row => row.elements[0]);

        if (optimizationType === "distance") {
            const distances = values.map(element => element.distance.value / 1000); // Convert to km
            metrics.minDistance = this.formatNumber(Math.min(...distances));
            metrics.maxDistance = this.formatNumber(Math.max(...distances));

            // Calculate weighted average distance
            const totalWeight = this.participants.reduce((sum, p) => sum + p.responseWeight, 0);
            const weightedSum = distances.reduce((sum, distance, index) =>
                sum + (distance * this.participants[index].responseWeight), 0);
            metrics.avgDistance = this.formatNumber(totalWeight > 0 ? weightedSum / totalWeight : 0);
        } else {
            const durations = values.map(element => element.duration.value / 60); // Convert to minutes
            metrics.minEta = this.formatNumber(Math.min(...durations));
            metrics.maxEta = this.formatNumber(Math.max(...durations));

            // Calculate weighted average ETA
            const totalWeight = this.participants.reduce((sum, p) => sum + p.responseWeight, 0);
            const weightedSum = durations.reduce((sum, duration, index) =>
                sum + (duration * this.participants[index].responseWeight), 0);
            metrics.avgEta = this.formatNumber(totalWeight > 0 ? weightedSum / totalWeight : 0);
        }

        return metrics;
    }

    public async findOptimalVenues(optimizationType: "eta" | "distance"): Promise<OptimizedVenue[]> {
        await this.initServices();
        const centroid = this.calculateCentroid();
        const venues = await this.searchVenues(centroid, optimizationType);

        const optimizedVenues = await Promise.all(
            venues.map(async (venue): Promise<OptimizedVenue> => {
                const metrics = await this.calculateMetrics(venue, optimizationType);
                return {
                    placeId: venue.place_id!,
                    name: venue.name!,
                    address: venue.vicinity!,
                    metrics,
                };
            }),
        );

        // Sort by the appropriate metric
        const sorted = optimizedVenues.sort((a, b) => {
            if (optimizationType === "distance") {
                return (a.metrics.avgDistance || 0) - (b.metrics.avgDistance || 0);
            } else {
                return (a.metrics.avgEta || 0) - (b.metrics.avgEta || 0);
            }
        });

        // Return only the top 3 venues
        return sorted.slice(0, 3);
    }
} 