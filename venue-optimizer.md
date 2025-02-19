# Venue Optimizer Specification

## Overview
The Venue Optimizer helps find optimal meeting locations based on participant locations and venue preferences, optimizing for total travel time across different transportation modes.

## Implementation Progress

### ✅ Core UI Setup (Completed)
- [x] Added location type selector in poll creation
- [x] Integrated with form state management
- [x] Toggle between standard location picker and smart location
- [x] Basic placeholder for venue preferences UI
- [x] Database schema changes for location optimization

### 🚧 Venue Preferences UI (Next Up)
- [ ] Create VenuePreferences component
  - [ ] Primary venue type selector (restaurant, cafe, etc.)
  - [ ] Optional sub-type field (pizza, sushi, etc.)
  - [ ] Minimum rating selector (1-5 stars)
  - [ ] Price level selector ($ to $$$$)
  - [ ] Operating hours validation against poll time
- [ ] Style to match existing UI components
- [ ] Add proper translations
- [ ] Integrate with form state

### 🚧 Participant Location Collection (Planned)
- [ ] Add location input to participant form
- [ ] Add transportation mode selector
- [ ] Store participant locations securely
- [ ] Show participant locations on map

### 🚧 Location Optimization (Planned)
- [ ] Implement optimization algorithm
- [ ] Integrate with Google Places API
- [ ] Calculate and rank venues
- [ ] Display top suggestions

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
1. Create the VenuePreferences component
   - Use existing UI components (selectors, inputs)
   - Match the design language of the app
   - Add proper validation

2. Update the participant form
   - Add location input
   - Add transport mode selector
   - Update participant creation/edit flows

3. Implement the optimization logic
   - Google Places API integration
   - Travel time calculations
   - Venue ranking algorithm

## Notes
- Core location type selection is now implemented
- Need to focus on venue preferences UI next
- Keep the UI simple and intuitive
- Maintain consistency with existing components
- All features should work with the existing location voting system 