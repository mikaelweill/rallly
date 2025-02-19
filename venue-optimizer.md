# Venue Optimizer Specification

## Overview
The Venue Optimizer helps find optimal meeting locations based on participant locations and venue preferences, optimizing for total travel time across different transportation modes.

## Core Components

### 1. Poll Creation Enhancement
#### Optimization Toggle
- Add "Enable Location Optimization" toggle during poll creation
- When enabled:
  - Hide standard location input interface
  - Show venue preference configuration panel

#### Venue Preferences Configuration
- **Venue Type Selection**
  - Primary venue type (e.g., "restaurant", "cafe", "bar")
  - Optional sub-type (e.g., "pizza", "sushi", "coffee")
- **Venue Criteria**
  - Minimum rating (1-5 stars)
  - Price level ($ to $$$$)
  - Operating hours validation against poll time

### 2. Participant Location & Transport
- Location input field for each participant
- Transportation mode selection (driving, transit, walking)
- Uses existing `PollLocation` model to store final selected venues

### 3. Location Optimization
#### Optimization Trigger
- "Optimize Location" button in poll finalization dialog
- Progress indicator during optimization
- Option to re-optimize if needed

#### Optimization Algorithm
1. **Data Collection**
   - Gather all participant locations
   - Collect transportation modes
   - Consider poll time slot(s)

2. **Travel Time Calculation**
   - Calculate ETAs for each participant based on their transport mode
   - Weight locations based on total travel time across all participants
   - Consider operating hours against poll time slot

3. **Venue Search**
   - Query Google Places API with:
     - Venue type/preferences
     - Rating/price criteria
     - Operating hours validation

4. **Ranking System**
   - Score venues based on:
     - Total weighted travel time across all participants
     - Match with venue preferences
     - Google rating and reviews
     - Price level
     - Operating hours compatibility

### 4. Results Display
#### Venue Suggestions
- Display top 3-5 optimized venues
- For each venue show:
  - Name and basic details
  - Individual travel times for each participant
  - Aggregate score based on total travel time
  - Operating hours
  - Price level
  - Rating and review count

#### Interactive Map
- Show all suggested venues
- Display participant starting points
- Travel routes visualization
- Click-through to venue details

### 5. Final Selection
- Allow poll creator to:
  - Select final venue from suggestions
  - Request new suggestions with adjusted criteria
  - Override with manual selection

## Technical Requirements

### API Integration
- Google Places API
  - Place Search
  - Place Details
  - Photos
- Google Distance Matrix API
  - Travel time calculations
  - Multiple transportation modes
- Google Maps Geocoding API
  - Address validation
  - Coordinate conversion

### Database Schema Updates
```prisma
model Poll {
  // ... existing fields ...
  isLocationOptimized Boolean @default(false)
  venuePreferences    VenuePreferences?
}

model VenuePreferences {
  id            String   @id @default(cuid())
  pollId        String   @unique
  poll          Poll     @relation(fields: [pollId], references: [id])
  venueType     String
  subType       String?
  minRating     Float?
  priceLevel    Int?     // 1-4
}

// Extend existing Participant model
model Participant {
  // ... existing fields ...
  startLocation ParticipantStartLocation?
}

model ParticipantStartLocation {
  id            String      @id @default(cuid())
  participantId String      @unique
  participant   Participant @relation(fields: [participantId], references: [id])
  latitude      Float
  longitude     Float
  address       String?
  transportMode String      @default("driving")
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

## Future Enhancements
- Real-time venue availability checking
- Weather consideration in venue scoring
- Public transport schedule integration
- Historical venue popularity data
- Dietary restriction considerations 