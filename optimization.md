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
- A finalization window that shows participant starting locations
- Two radio buttons for optimization type (ETA vs Distance)
- A disabled "Calculate Optimal Venues" button

## Implementation Plan (Revised)

### Phase 1: Basic UI Flow
Each step should be individually testable:

1. Button States ✅
   ```typescript
   // Calculate button enabled when:
   const canCalculate = 
     !!selectedDate &&
     !!optimizationType &&
     participantsWithLocation.length >= 2;
   
   // Finalize button enabled when:
   const canFinalize = !!selectedVenue;
   ```

2. Optimization Type Selection (Current Focus)
   - [x] Add radio buttons
   - [x] Style selected state
   - [ ] Fix translation issues
   - [ ] Add loading state to radio buttons during calculation

3. Calculate Button
   - [x] Add button
   - [x] Handle disabled state
   - [ ] Add loading state
   - [ ] Add error state
   - [ ] Add success state

4. Results Display (Next Up)
   - [ ] Create basic venue card component
   - [ ] Show venue name and address
   - [ ] Add selection mechanism
   - [ ] Show relevant metrics based on optimization type:
     * For ETA: min/avg/max travel time
     * For Distance: min/avg/max distance

5. Finalize Flow
   - [ ] Enable button only after venue selection
   - [ ] Add confirmation dialog
   - [ ] Handle submission to database
   - [ ] Show success/error feedback

### Immediate Next Steps

1. Fix Current Issues:
   ```typescript
   // 1. Fix translation keys
   const { t } = useTranslation("common");
   
   // 2. Add proper loading states
   const [isCalculating, setIsCalculating] = useState(false);
   
   // 3. Add error handling
   const [error, setError] = useState<string | null>(null);
   ```

2. Create Basic Venue Card:
   ```typescript
   interface VenueCardProps {
     name: string;
     address: string;
     metrics: {
       avg: number;
       min: number;
       max: number;
     };
     type: 'eta' | 'distance';
     isSelected: boolean;
     onSelect: () => void;
   }
   ```

3. Test Cases for Each Step:
   ```
   1. Button States
      - Should be disabled initially
      - Should enable when all conditions met
      - Should disable during calculation
   
   2. Optimization Selection
      - Should highlight selected option
      - Should enable calculate button
      - Should persist selection
   
   3. Venue Display
      - Should show correct metrics
      - Should handle selection
      - Should update finalize button
   ```

### Phase 2: Core Optimization
(After UI flow is working)
- [ ] Implement participant weight calculation
- [ ] Build venue search with Google Places
- [ ] Create basic scoring system
- [ ] Add travel time/distance calculations

### Phase 3: Advanced Features
- [ ] Add support for both optimization modes
- [ ] Implement weighted centroid calculation
- [ ] Add venue filtering based on preferences
- [ ] Create detailed score breakdown

### Phase 4: Polish & Performance
- [ ] Add loading states and progress indicators
- [ ] Implement error handling and fallbacks
- [ ] Cache API results
- [ ] Optimize bulk calculations

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