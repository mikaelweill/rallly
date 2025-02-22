# Location Optimization Algorithm Specification

## Overview
The location optimization algorithm combines participant location data with their time preferences to suggest optimal meeting venues. It weighs both spatial (distance/ETA) and temporal (vote preferences) factors to provide the best recommendations.

## Recent Improvements

### ✅ Venue Type Filtering (Completed)
- Fixed venue type filtering to be more accurate and consistent
- Now properly uses Google Places API's primary type
- Removed complex blacklisting in favor of trusting Google's primary type categorization
- Ensures venues are primarily of the requested type (e.g., cafes are actually cafes, not grocery stores with cafes inside)

### ✅ Search Results Handling (Completed)
- Distance optimization: Gets all venues, sorts by distance, takes top 3
- ETA optimization: Gets all venues within radius, calculates ETAs, sorts by ETA
- Consistent filtering across both modes
- Proper handling of permanently closed venues

### ✅ Weighted Calculations (Completed)
- Proper weighting of participant votes (1.0 for yes, 0.5 for maybe, 0 for no)
- Weighted average calculations for both distance and ETA metrics
- Fallback to simple average when no participants can attend
- Proper handling of participant response weights in venue scoring

## Immediate Tasks

### 1. Venue Selection UI
- [ ] Add selection state to venue cards
- [ ] Add select/confirm button to each venue card
- [ ] Highlight selected venue in the list
- [ ] Add confirmation dialog for venue selection

### 2. Database Updates
- [ ] Add venue details to Event model:
```typescript
interface EventVenue {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
}

// Database schema update
model Event {
    // ... existing fields
    venue        EventVenue?
}
```
- [ ] Add API endpoint to save selected venue
- [ ] Update finalize poll mutation to include venue

### 3. Event Display
- [ ] Add venue section to event display
- [ ] Show venue name, address, and map
- [ ] Add directions link for participants
- [ ] Display travel times for participants

## Implementation Plan

### Phase 1: Selection UI
```typescript
interface VenueCard {
    venue: Venue;
    metrics: VenueMetrics;
    isSelected: boolean;
    onSelect: () => void;
}

interface ConfirmVenueDialog {
    venue: Venue;
    onConfirm: () => void;
    onCancel: () => void;
}
```

### Phase 2: Database Updates
```typescript
// API endpoint
async function finalizeWithVenue(pollId: string, venue: EventVenue) {
    // Save venue details with event
    // Update poll status
    // Send notifications
}
```

### Phase 3: Event Display
```typescript
interface EventVenueDisplay {
    venue: EventVenue;
    participantTravelTimes?: {
        [participantId: string]: {
            duration: number;
            distance: number;
        };
    };
}
```

## Testing Strategy

### Unit Tests
```typescript
test("venue selection", () => {
    // Test venue card selection
    // Test confirmation dialog
    // Test data validation
});

test("venue persistence", () => {
    // Test database updates
    // Test API endpoint
    // Test error handling
});
```

### Integration Tests
```typescript
test("end-to-end venue selection", () => {
    // Test selection flow
    // Test persistence
    // Test display updates
});
```

## Notes
- Keep the selection UI simple and intuitive
- Ensure proper validation before saving
- Add clear success/error feedback
- Make venue details easily accessible in event view

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