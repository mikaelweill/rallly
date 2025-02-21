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

    constructor(participants: Participant[], selectedDate: Date) {
        this.participants = participants;
        this.selectedDate = selectedDate;
    }

    private async initServices() {
        await loadGoogleMapsScript();
        const mapDiv = document.createElement("div");
        const map = new google.maps.Map(mapDiv);
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

    private async searchVenues(centroid: { lat: number; lng: number }): Promise<google.maps.places.PlaceResult[]> {
        if (!this.placesService) {
            throw new Error("Places service not initialized");
        }

        return new Promise((resolve, reject) => {
            const request: google.maps.places.PlaceSearchRequest = {
                location: new google.maps.LatLng(centroid.lat, centroid.lng),
                radius: 5000, // 5km radius
                type: "restaurant", // Start with restaurants, can be expanded
            };

            this.placesService.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    resolve(results.slice(0, 3)); // Get top 3 results
                } else {
                    reject(new Error(`Places search failed: ${status}`));
                }
            });
        });
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
            metrics.minDistance = Math.min(...distances);
            metrics.maxDistance = Math.max(...distances);
            metrics.avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
        } else {
            const durations = values.map(element => element.duration.value / 60); // Convert to minutes
            metrics.minEta = Math.min(...durations);
            metrics.maxEta = Math.max(...durations);
            metrics.avgEta = durations.reduce((a, b) => a + b, 0) / durations.length;
        }

        return metrics;
    }

    public async findOptimalVenues(optimizationType: "eta" | "distance"): Promise<OptimizedVenue[]> {
        await this.initServices();
        const centroid = this.calculateCentroid();
        const venues = await this.searchVenues(centroid);

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

        // Sort by average metric (either distance or ETA)
        return optimizedVenues.sort((a, b) => {
            if (optimizationType === "distance") {
                return (a.metrics.avgDistance || 0) - (b.metrics.avgDistance || 0);
            } else {
                return (a.metrics.avgEta || 0) - (b.metrics.avgEta || 0);
            }
        });
    }
} 