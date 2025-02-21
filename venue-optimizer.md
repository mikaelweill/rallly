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

### ✅ Participant Location Collection (Completed)
- [x] Add participant location input UI:
  - [x] Reuse existing map component from non-optimized polls
  - [x] Add Google Places autocomplete search bar
  - [x] Add "Use current location" button with crosshair icon
  - [x] Show existing participant start locations as pins
  - [x] Auto-zoom map to show all participant pins
  - [x] Add new participant location as a distinct pin
- [x] Add transportation mode selector for participants
- [x] Store participant locations securely
- [x] Add chronological ordering for locations
- [x] Ensure pins and addresses match in order
- [x] Clear temporary locations after saving

### 🚧 UX Improvements (In Progress)
- [ ] Add loading states and visual feedback:
  - [ ] Loading indicator during geocoding
  - [ ] Success animation when location is saved
  - [ ] Clear error states for geocoding failures
- [ ] Mobile optimization:
  - [ ] Touch-friendly controls
  - [ ] Responsive layout improvements
  - [ ] Mobile-specific error states
- [ ] Performance improvements:
  - [ ] Optimize re-renders
  - [ ] Cache geocoding results
  - [ ] Lazy load map components

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

2. ✅ Participant Location Collection:
   - Location input with map component complete
   - Transportation mode selection implemented
   - Secure location storage with proper ordering
   - Pins and addresses match in chronological order
   - Temporary location handling working correctly

3. 🚧 Next Priority - UX Polish:
   - Add loading states and visual feedback
   - Optimize for mobile devices
   - Improve performance and caching
   - Add proper error handling

4. 🎯 Future Work - Venue Optimization:
   - Develop venue search and ranking algorithm
   - Create suggestion UI with venue details
   - Implement travel time calculations
   - Add real-time updates as participants add locations

## Notes
- UI for venue preferences and location collection is now complete
- Map component successfully reused with proper functionality
- Location storage and ordering issues resolved
- Need to focus on UX polish and mobile optimization
- Consider rate limiting and API usage costs
- All features should work with the existing location voting system 