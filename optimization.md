# Location Optimization Algorithm Specification

## Overview
The location optimization algorithm combines participant location data with their time preferences to suggest optimal meeting venues. It weighs both spatial (distance/ETA) and temporal (vote preferences) factors to provide the best recommendations.

## Participant Weighting System

### Vote Weight Calculation
Each participant's influence on the venue selection is weighted based on their vote for the selected date:
- 👍 "Yes" vote on selected date: Weight = 1.0
- 🤔 "Maybe" vote on selected date: Weight = 0.5
- 👎 "No" vote or no vote on selected date: Weight = 0.0

This ensures that:
- Participants who can attend have the most influence
- Participants who might attend have some influence
- Participants who can't attend don't influence the venue choice

### Example
```typescript
interface ParticipantWeight {
  participantId: string;
  weight: number;  // 0.0, 0.5, or 1.0 based on selected date's vote
  location: {
    lat: number;
    lng: number;
    transportMode: string;
  };
}
```

## Optimization Modes

### 1. ETA-Based Optimization
Optimizes for total travel time:
- Considers real-time traffic conditions
- Accounts for different transport modes
- Weights travel times by participant vote weight
- Formula: `score = sum(participant.weight * travelTime)`

### 2. Distance-Based Optimization
Optimizes for physical distance:
- Uses straight-line or route distance
- Ignores traffic conditions
- Weights distances by participant vote weight
- Formula: `score = sum(participant.weight * distance)`

## Algorithm Steps

### 1. Data Collection
```typescript
interface OptimizationInput {
  selectedDate: string;  // The specific date chosen for the meeting
  participants: Array<{
    id: string;
    location: ParticipantLocation;
    voteForSelectedDate: VoteType;  // Vote for the specific date only
    transportMode: TransportMode;
  }>;
  venuePreferences: VenuePreferences;
}
```

### 2. Weight Calculation
1. For each participant:
   - Get vote for the selected date
   - Assign weight based on that specific date's vote:
     * Yes = 1.0
     * Maybe = 0.5
     * No/None = 0.0
   - Store location and transport mode

### 3. Venue Search
1. Calculate search area:
   - Find weighted centroid of participant locations
   - Determine appropriate search radius
2. Query venues using Google Places API:
   - Filter by venue preferences (type, rating, price)
   - Get initial set of 20 potential venues

### 4. Travel Time/Distance Calculation
For each potential venue:
1. Calculate metrics for each participant:
   ```typescript
   interface VenueScore {
     venueId: string;
     totalWeightedTime: number;    // For ETA mode
     totalWeightedDistance: number; // For Distance mode
     maxParticipantTime: number;   // Longest individual travel time
     averageTime: number;          // Average travel time
     scores: {
       timeScore: number;   // 0-1 score for travel time
       ratingScore: number; // 0-1 score for venue rating
       priceScore: number;  // 0-1 score for price match
     };
   }
   ```
2. Apply participant weights
3. Calculate venue's final score

### 5. Ranking & Selection
1. Sort venues by score (lower is better)
2. Filter out venues with extreme individual travel times
3. Return top 3 recommendations with details:
   ```typescript
   interface VenueRecommendation {
     venue: {
       id: string;
       name: string;
       address: string;
       rating: number;
       priceLevel: number;
       photos: string[];
     };
     travelTimes: Array<{
       participantId: string;
       duration: number;
       distance: number;
     }>;
     scores: {
       total: number;
       breakdown: {
         travelScore: number;
         ratingScore: number;
         priceScore: number;
       };
     };
   }
   ```

## UI Components

### Optimization Controls
```typescript
interface OptimizationControls {
  mode: 'eta' | 'distance';
  maxTravelTime?: number;  // Optional limit
  dateSelection: string;   // Selected date to optimize for
}
```

### Results Display
1. Top 3 venues shown in cards with:
   - Venue name, address, rating, price level
   - Average travel time/distance
   - Individual travel times for each participant
   - Map showing venue and participant routes
   - Venue photos and details

## Current State
We have:
- [x] A finalization window that shows participant starting locations
- [x] Two radio buttons for optimization type (ETA vs Distance)
- [x] A "Calculate Optimal Venues" button that enables when conditions are met
- [x] Basic venue search functionality
- [ ] Proper ETA-based venue ranking
- [ ] Venue selection via cards and map
- [ ] Interactive map showing venues and routes

### Phase 1: Venue Optimization & Selection (Current Focus)

1. ETA Optimization Update
   ```typescript
   // Current approach (needs update):
   - Gets 3 closest venues physically
   - Calculates ETA for those 3
   - Sorts by physical distance

   // Correct approach:
   - Calculate weighted centroid based on participant votes
   - Use Distance Matrix API to get ETAs to nearby venues
   - Sort and select top 3 venues by weighted ETA
   ```

2. Venue Display and Selection
   ```typescript
   interface VenueCard {
     venue: VenueDetails;
     metrics: VenueMetrics;
     isSelected: boolean;
     onSelect: () => void;
   }

   interface VenueMap {
     participants: Location[];
     venues: VenueDetails[];
     selectedVenueId?: string;
     onVenueSelect: (venueId: string) => void;
     // Make map component removable/toggleable
     className?: string;
     style?: React.CSSProperties;
   }
   ```

### Immediate Next Steps

1. Fix ETA Optimization:
   - Update centroid calculation to use weighted positions
   - Modify venue search to sort by actual ETAs
   - Apply proper weighting from participant votes

2. Enhance Venue Selection:
   - Add selection state to venue cards
   - Make venues clickable on both cards and map
   - Show routes to selected venue
   - Make map component toggleable/removable

3. Improve UI Layout:
   - Show map alongside venue cards
   - Add venue markers with distinct styling
   - Make map collapsible/removable if needed
   - Ensure responsive layout works

## Implementation Plan (Revised)

### Phase 1: Venue Optimization & Selection (Current Focus)

1. ETA Optimization Update
   ```typescript
   // Current approach (needs update):
   - Gets 3 closest venues physically
   - Calculates ETA for those 3
   - Sorts by physical distance

   // Correct approach:
   - Calculate weighted centroid based on participant votes
   - Use Distance Matrix API to get ETAs to nearby venues
   - Sort and select top 3 venues by weighted ETA
   ```

2. Venue Selection Flow
   ```typescript
   interface VenueSelectionStep {
     // First: Show venue cards with metrics
     venues: Array<{
       id: string;
       name: string;
       metrics: VenueMetrics;
     }>;
     selectedVenueId: string | null;
   }

   interface ConfirmationStep {
     // Then: Show map with routes
     selectedVenue: Venue;
     participantLocations: Location[];
     routes: Array<{
       participantId: string;
       route: RouteDetails;
     }>;
   }
   ```

### Immediate Next Steps

1. Update ETA Optimization:
   - Keep venue search the same (3 closest)
   - Update sorting to use weighted ETAs
   - Apply participant vote weights

2. Create Confirmation Step:
   - Add new confirmation dialog/screen
   - Show map with:
     * All participant locations
     * Selected venue
     * Routes to venue
   - Add final confirmation button

3. Implement Selection Flow:
   - Add selection state to venue cards
   - Show confirmation step after selection
   - Add final confirmation button
   - Handle database update

### Testing Strategy Updates

1. ETA Optimization Tests:
   ```typescript
   test("eta optimization", () => {
     // Verify gets more than 3 initial venues
     // Verify proper ETA calculations
     // Verify correct weighting by votes
     // Verify returns best 3 by ETA
   });
   ```

2. Map Integration Tests:
   ```typescript
   test("map venue display", () => {
     // Verify venues appear on map
     // Verify correct marker styling
     // Verify selection updates
     // Verify routes display
   });
   ```

3. Selection Flow Tests:
   ```typescript
   test("venue selection", () => {
     // Verify card selection state
     // Verify map selection state
     // Verify finalize button enables
     // Verify selection persists
   });
   ```

## Testing Strategy

1. UI Flow Tests:
   ```typescript
   // Test each state transition
   test("optimization type selection", () => {
     // Select ETA
     // Verify calculate button state
     // Verify UI updates
   });

   test("venue selection", () => {
     // Select venue
     // Verify finalize button state
     // Verify UI updates
   });
   ```

2. Integration Tests:
   ```typescript
   test("end-to-end flow", () => {
     // Select date
     // Select optimization type
     // Calculate venues
     // Select venue
     // Finalize
     // Verify database update
   });
   ```

## Notes
- Keep changes small and testable
- Focus on one component at a time
- Add proper error handling at each step
- Use loading states to prevent multiple submissions
- Validate data at each step 