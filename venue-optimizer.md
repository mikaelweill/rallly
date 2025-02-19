# Venue Optimizer Specification

## Overview
The Venue Optimizer is an intelligent feature that helps find the optimal meeting location based on participant locations and venue preferences. It leverages Google Places API to suggest venues that best accommodate all participants while meeting specified criteria.

## Core Components

### 1. Poll Creation Enhancement
#### Optimization Toggle
- Add "Enable Location Optimization" toggle during poll creation
- When enabled:
  - Hide standard location input interface
  - Show venue preference configuration panel
  - Display explanation tooltip about the feature

#### Venue Preferences Configuration
- **Venue Type Selection**
  - Primary venue type (e.g., "restaurant", "cafe", "bar")
  - Optional sub-type (e.g., "pizza", "sushi", "coffee")
- **Venue Criteria**
  - Minimum rating (1-5 stars)
  - Price level ($ to $$$$)
  - Maximum capacity (if available)
  - Accessibility requirements
  - Additional amenities (parking, wifi, etc.)

### 2. Participant Location Collection
#### Location Input
- Optional "Starting Location" field for participants
- Multiple input methods:
  - Browser geolocation
  - Manual address input
  - Map pin placement
  - Current location detection

#### Privacy & Security
- Locations stored with encryption
- Clear privacy policy display
- Option to remove location data
- Anonymized location display

### 3. Location Optimization
#### Optimization Trigger
- "Optimize Location" button in poll finalization dialog
- Progress indicator during optimization
- Option to re-optimize if needed

#### Optimization Algorithm
1. **Data Collection**
   - Gather all participant locations
   - Apply weights for participants without locations
   - Consider poll time slot(s)

2. **Central Point Calculation**
   - Calculate weighted centroid of all locations
   - Define search radius based on participant spread

3. **Venue Search**
   - Query Google Places API with:
     - Venue type/preferences
     - Rating/price criteria
     - Operating hours validation
     - Capacity requirements

4. **Ranking System**
   - Score venues based on:
     - Average travel time for participants
     - Match with preferences
     - Google rating and reviews
     - Price level
     - Operating hours compatibility
     - Historical venue popularity (if available)

### 4. Results Display
#### Venue Suggestions
- Display top 3-5 optimized venues
- For each venue show:
  - Name and basic details
  - Average travel time for participants
  - Match score with preferences
  - Available booking links (if applicable)
  - Operating hours
  - Price level
  - Rating and review count

#### Interactive Map
- Show all suggested venues
- Display participant distribution (anonymized)
- Travel time visualization
- Click-through to venue details

### 5. Final Selection
- Allow poll creator to:
  - Select final venue from suggestions
  - Request new suggestions with adjusted criteria
  - Override with manual selection if needed

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
  maxCapacity   Int?
  requirements  Json?    // Additional requirements as JSON
}

model ParticipantLocation {
  id            String      @id @default(cuid())
  participantId String      @unique
  participant   Participant @relation(fields: [participantId], references: [id])
  latitude      Float
  longitude     Float
  address       String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

## Privacy & Security Considerations
- Participant locations stored securely and encrypted
- Clear consent process for location sharing
- Option to delete location data
- Anonymized location display in aggregate
- Compliance with GDPR and other privacy regulations

## Future Enhancements
- Integration with venue booking systems
- Real-time venue availability checking
- Weather consideration in venue scoring
- Public transport accessibility scoring
- Historical venue popularity data
- Group size optimization
- Dietary restriction considerations
- Accessibility requirements filtering 