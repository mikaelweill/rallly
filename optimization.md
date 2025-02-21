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

## Implementation Plan

### Phase 1: Core Algorithm
- [ ] Implement participant weight calculation
- [ ] Build venue search with Google Places
- [ ] Create basic scoring system
- [ ] Add travel time/distance calculations

### Phase 2: Advanced Features
- [ ] Add support for both optimization modes
- [ ] Implement weighted centroid calculation
- [ ] Add venue filtering based on preferences
- [ ] Create detailed score breakdown

### Phase 3: UI Integration
- [ ] Add optimization controls to admin view
- [ ] Create venue recommendation cards
- [ ] Implement interactive results map
- [ ] Add travel time breakdown view

### Phase 4: Performance & Polish
- [ ] Cache API results
- [ ] Optimize bulk travel time calculations
- [ ] Add loading states and progress indicators
- [ ] Implement error handling and fallbacks

## Technical Considerations

### API Usage
- Batch Google Places API calls
- Cache results when possible
- Implement rate limiting
- Handle API errors gracefully

### Performance
- Use bulk distance matrix calculations
- Cache intermediate results
- Implement progressive loading
- Consider serverless functions for heavy calculations

### Data Storage
```typescript
interface OptimizationResult {
  id: string;
  pollId: string;
  dateId: string;
  mode: 'eta' | 'distance';
  recommendations: VenueRecommendation[];
  calculatedAt: Date;
  expiresAt: Date;  // Cache expiration
}
```

## Notes
- Weights are calculated based on the specific date selected during finalization
- A participant's votes on other dates don't affect their weight
- This ensures venues are optimized for people who can actually attend
- Consider adding a minimum total weight threshold before suggesting venues
- Cache results but expire them after a reasonable time
- Add fallback venues if top picks are unavailable 