# Location Voting Implementation Plan

## Current Status

✅ Phase 1: Data Layer Foundation
- Created LocationVote model with same pattern as time voting
- Added necessary relations to Poll, Participant, and PollLocation models
- Successfully created and applied database migration
- Reused existing VoteType enum (yes/no/ifNeedBe)

✅ Phase 2: API Layer
- Added Location Vote Mutations to participants router
- Implemented location votes in participant.add and participant.update
- Added location votes to participant.list query
- Added location votes to poll queries
- All API endpoints support location voting with the same pattern as time voting
- Successfully tested API endpoints with database migrations
- Verified Prisma client generation and schema updates

🟡 Phase 3: Core Components (In Progress)
1. ✅ Location Voting Form (`components/poll/location-voting-form.tsx`)
   - Created base component structure
   - Implemented vote state management
   - Added vote type toggles (Yes/No/If-need-be)
   - Reused voting patterns from time voting components
   - Handle empty location states
   - Transformed UI to match time voting with inverted rows/columns
   - Added participant avatars in header
   - Implemented consistent vote indicators and selectors

2. ✅ Location Option (`components/poll/location-option.tsx`)
   - Display location details
   - Added voting controls
   - Handle vote changes
   - Reuse vote type components from time voting

3. ✅ Desktop Poll Integration
   - Added locations tab alongside times tab
   - Integrated LocationVotingForm into the desktop view
   - Basic voting functionality working

## Current Issues to Fix
1. 🔴 Type Errors
   - Fix `locations` property type in GetPollApiResponse
   - Add proper typing for location and index parameters
   - Import VoteType type where needed

## Next Steps

### 1. Polish Location Table UI
- [ ] Add score summary for each location (like time slots have)
- [ ] Add hover states for rows and columns
- [ ] Add scroll shadows for horizontal scrolling
- [ ] Consider adding location details tooltip on hover
- [ ] Add loading states for vote changes
- [ ] Add success feedback for vote changes

### 2. Enhance Vote Confirmation UI
- [ ] Improve vote summary titles in confirmation modal
- [ ] Add clear feedback about what was voted on
- [ ] Show location details in vote summary
- [ ] Ensure consistent UX with time vote confirmation

### 3. Improve Voting Flow
- [ ] Add "New Participant" form in locations tab
- [ ] Ensure consistent participant creation flow between tabs
- [ ] Fix voting state synchronization between time and location tabs
- [ ] Add proper error handling for vote failures

### 4. Testing & Mobile
- [ ] Add unit tests for location voting components
- [ ] Test mobile responsiveness of table layout
- [ ] Test error cases and edge cases
- [ ] Test with large numbers of participants and locations
- [ ] Test voting flow across tabs

### 5. Future Enhancements
- [ ] Add map preview when location is expanded
- [ ] Add location search/filter capabilities
- [ ] Consider grouping locations by area/distance
- [ ] Add location sorting options
- [ ] Consider adding location categories/tags

Would you like me to start fixing the type errors or work on any of the polish items? 