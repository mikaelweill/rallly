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

### 🚧 Venue Preferences UI (In Progress)
- [x] Basic venue type selector
- [ ] Add price range selector ($ to $$$$)
- [ ] Add minimum rating selector (1-5 stars)
- [ ] Add operating hours validation against poll time
- [ ] Style to match existing UI components
- [ ] Add proper translations

### 🚧 Participant Location Collection (Next Up)
- [ ] Add location input to participant form
- [ ] Add transportation mode selector (driving, transit, walking)
- [ ] Store participant locations securely
- [ ] Show participant locations on map
- [ ] Add privacy controls for location sharing

### 🚧 Location Optimization (Planned)
- [ ] Set up Google Places API integration
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

### Next Steps
1. Implement additional venue preferences:
   - Add price range selector using radio buttons or slider
   - Add rating selector with star visualization
   - Consider adding cuisine type for restaurants

2. Create participant location collection:
   - Design mobile-friendly location input
   - Implement geocoding for addresses
   - Add transport mode selection
   - Consider privacy implications

3. Set up venue optimization:
   - Create Google Places API service
   - Implement caching for API responses
   - Design ranking algorithm
   - Create venue suggestion UI

## Notes
- Core venue type selection is now implemented with official Google Places types
- Need to focus on additional preferences next
- Keep the UI simple and intuitive
- Consider rate limiting and API usage costs
- All features should work with the existing location voting system 