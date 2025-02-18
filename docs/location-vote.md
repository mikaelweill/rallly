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

## Next Phases

### Phase 3: Core Components (Next)
1. Location Voting Form (`components/poll/location-voting-form.tsx`)
   - [ ] Create base component structure
   - [ ] Implement vote state management
   - [ ] Add vote type toggles (Yes/No/If-need-be)
   - [ ] Reuse voting patterns from time voting components
   - [ ] Handle empty location states

2. Location Option (`components/poll/location-option.tsx`)
   - [ ] Display location details
   - [ ] Show map preview
   - [ ] Add voting controls
   - [ ] Handle vote changes
   - [ ] Reuse vote type components from time voting
   - [ ] Add loading states for map preview

3. Location Grid (`components/poll/location-voting-grid.tsx`)
   - [ ] Grid layout similar to time voting
   - [ ] Responsive design
   - [ ] Vote status indicators
   - [ ] Participant summary view
   - [ ] Handle polls with no locations gracefully

### Phase 4: Integration
1. Update Existing Components
   - [ ] Modify `voting-form.tsx` to include location voting
   - [ ] Update `desktop-poll.tsx` and `mobile-poll.tsx`
   - [ ] Add location votes to participant summary
   - [ ] Ensure consistent UX between time and location voting
   - [ ] Add toggle between time and location voting views

2. State Management
   - [ ] Add location vote state to poll context
   - [ ] Implement vote submission logic
   - [ ] Add optimistic updates
   - [ ] Handle loading and error states
   - [ ] Sync state between time and location votes

### Phase 5: Polish & Testing
1. UI/UX Refinements
   - [ ] Mobile-friendly layout
   - [ ] Loading states
   - [ ] Error handling
   - [ ] Success notifications
   - [ ] Consistent styling with time voting
   - [ ] Smooth transitions between voting modes

2. Testing
   - [ ] Unit tests for new components
   - [ ] Integration tests for vote submission
   - [ ] Mobile responsiveness testing
   - [ ] Error case testing
   - [ ] Test backward compatibility with existing polls

## Implementation Notes
- Keep location voting separate but visually consistent with time voting
- Maintain same voting patterns (yes/no/if-need-be)
- Ensure backward compatibility for polls without locations
- Consider performance with multiple locations
- Reuse existing voting components and patterns where possible
- Handle gracefully when switching between time and location voting
- Consider UX for polls with many locations

## Next Steps
1. Begin implementing the core UI components:
   - Start with `location-option.tsx` to display individual locations
   - Create `location-voting-form.tsx` reusing patterns from time voting
   - Implement the location grid layout
2. Add location vote state management to the poll context
3. Test the complete voting flow with the new UI components

Would you like to start with implementing the core UI components? The recommended approach would be to:
1. First create the `location-option.tsx` component to establish the base voting UI
2. Then implement the grid layout to display multiple locations
3. Finally integrate with the voting form and state management 