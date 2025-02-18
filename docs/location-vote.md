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

2. ✅ Location Option (`components/poll/location-option.tsx`)
   - Display location details
   - Added voting controls
   - Handle vote changes
   - Reuse vote type components from time voting

3. ✅ Desktop Poll Integration
   - Added locations tab alongside times tab
   - Integrated LocationVotingForm into the desktop view
   - Basic voting functionality working

## Next Steps

### 1. Improve Voting Flow (Next)
- [ ] Add "New Participant" button in locations tab (matching times tab)
- [ ] Ensure consistent participant creation flow between tabs
- [ ] Fix voting state synchronization between time and location tabs

### 2. Enhance Vote Confirmation UI
- [ ] Improve vote summary titles in confirmation modal
- [ ] Add clear feedback about what was voted on
- [ ] Show location details in vote summary
- [ ] Ensure consistent UX with time vote confirmation

### 3. Polish & Testing
- [ ] Mobile responsiveness testing
- [ ] Error case testing
- [ ] Add loading states
- [ ] Add map preview for locations (future enhancement)
- [ ] Add success notifications
- [ ] Ensure consistent styling with time voting

### 4. Future Enhancements
- [ ] Add map preview when location is expanded
- [ ] Improve location display with more details
- [ ] Add location search/filter capabilities
- [ ] Consider grouping locations by area/distance

Would you like me to start implementing the improved voting flow with the "New Participant" button in the locations tab? 