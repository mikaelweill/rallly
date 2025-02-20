# Venue Optimizer Specification

## Overview
The Venue Optimizer helps find optimal meeting locations based on participant locations and venue preferences, optimizing for total travel time across different transportation modes.

## Implementation Progress

### ✅ Core UI Setup (Completed)
- [x] Added location type selector in poll creation
- [x] Integrated with form state management
- [x] Toggle between standard location picker and smart location
- [x] Created categorized venue type dropdown with official Google Places types
- [x] Database schema changes for location optimization
- [x] Added "Smart Location" badge to poll header

### ✅ Venue Preferences UI (Completed)
- [x] Basic venue type selector
- [x] Add price range selector ($ to $$$$) with clear "Price: $" format
- [x] Add minimum rating selector with "X+ stars" display
- [x] Style to match existing UI components
- [x] Integrate preferences into poll view
- [x] Add informative message about location optimization
- [ ] Add proper translations

### 🚧 Participant Location Collection (In Progress)
- [ ] Add participant location input UI:
  - [ ] Reuse existing map component from non-optimized polls
  - [ ] Add Google Places autocomplete search bar
  - [ ] Add "Use current location" button with crosshair icon
  - [ ] Show existing participant start locations as pins
  - [ ] Auto-zoom map to show all participant pins
  - [ ] Add new participant location as a distinct pin
- [ ] Add transportation mode selector for participants
- [ ] Store participant locations securely
- [ ] Add privacy controls for location sharing

### 🚧 Location Optimization (Planned)
- [x] Set up Google Places API integration
- [ ] Implement venue search within radius
- [ ] Calculate travel times for each participant
- [ ] Rank venues based on:
  - [ ] Average travel time
  - [ ] Venue rating
  - [ ] Price level match
  - [ ] Operating hours
- [ ] Display top suggestions with details

## Technical Details

### Completed Schema Changes
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

### Current Status
1. ✅ Core UI Implementation:
   - Smart location toggle and preferences in poll creation
   - Venue type, price, and rating selectors
   - Clear badges showing preferences in poll view
   - Informative messaging about the optimization process

2. 🚧 Next Priority - Participant Location Collection:
   - Implement location input using existing map component
   - Add existing participant locations to map view
   - Add transportation mode selection
   - Implement secure location storage
   - Add privacy settings and consent flow

3. 🎯 Future Work - Venue Optimization:
   - Develop venue search and ranking algorithm
   - Create suggestion UI with venue details
   - Implement travel time calculations
   - Add real-time updates as participants add locations

## Notes
- UI for venue preferences is now complete with intuitive display
- Will reuse existing map component and location input functionality
- Need to implement participant location collection and transportation modes
- Consider rate limiting and API usage costs
- All features should work with the existing location voting system 