# Location Voting Implementation Plan

## Current Status

✅ Phase 1: Data Layer Foundation
- Created LocationVote model with same pattern as time voting
- Added necessary relations to Poll, Participant, and PollLocation models
- Successfully created and applied database migration
- Reused existing VoteType enum (yes/no/ifNeedBe)
- Added location support to Event model for finalization

✅ Phase 2: API Layer
- Added Location Vote Mutations to participants router
- Implemented location votes in participant.add and participant.update
- Added location votes to participant.list query
- Added location votes to poll queries
- All API endpoints support location voting with the same pattern as time voting
- Successfully tested API endpoints with database migrations
- Verified Prisma client generation and schema updates
- Updated book mutation to support location finalization

✅ Phase 3: Core Components
1. ✅ Location Voting Form (`components/poll/location-voting-form.tsx`)
   - Created base component structure
   - Implemented vote state management
   - Added vote type toggles (Yes/No/If-need-be)
   - Reused voting patterns from time voting components
   - Handle empty location states
   - Transformed UI to match time voting with inverted rows/columns
   - Added participant avatars in header
   - Implemented consistent vote indicators and selectors
   - Added numbered prefixes to locations

2. ✅ Location Option (`components/poll/location-option.tsx`)
   - Display location details
   - Added voting controls
   - Handle vote changes
   - Reuse vote type components from time voting

3. ✅ Desktop Poll Integration
   - Added locations tab alongside times tab
   - Integrated LocationVotingForm into the desktop view
   - Basic voting functionality working
   - Implemented vote confirmation display
   - Added location numbering consistency

4. ✅ Vote Confirmation UI
   - Added proper location display in confirmation modal
   - Implemented vote summary for both time and location votes
   - Added location numbering in confirmation view
   - Maintained consistent vote type display (Yes/No/If Need Be)
   - Added proper icons for time and location sections

5. ✅ Poll Finalization
   - Added location selection to finalization dialog
   - Implemented location score display
   - Added location vote summary progress bars
   - Updated database schema to store finalized location
   - Extended book mutation to handle location selection

## Current Focus Areas

### 1. Poll Finalization
- [x] Update database schema to store finalized location
  - [x] Added locationId to Event model
  - [x] Added relation between Event and PollLocation
  - [x] Created and applied database migration
- [x] Update finalization flow to include location selection
  - [x] Add location selection UI in finalization dialog
  - [x] Show location votes and scores in finalization view
  - [x] Allow selecting final location alongside time
  - [x] Update booking mutation to save location
- [ ] Update event display
  - [ ] Show finalized location in events view
  - [ ] Add location to calendar event exports
  - [ ] Include location in event notifications

Next Steps:
1. Update event view to show finalized location
2. Add location to calendar event exports
3. Include location in finalization notifications

### 2. Polish Location Table UI
- [ ] Add score summary for each location (like time slots have)
- [ ] Add hover states for rows and columns
- [ ] Add scroll shadows for horizontal scrolling
- [ ] Consider adding location details tooltip on hover
- [ ] Add loading states for vote changes
- [ ] Add success feedback for vote changes

### 3. Improve Voting Flow
- [ ] Remove tab-based navigation in favor of unified view
- [ ] Stack time and location voting vertically on the same page
- [ ] Consolidate save action to handle both vote types at once
- [ ] Ensure consistent participant creation flow with single form submission
- [ ] Fix voting state synchronization between time and location sections

### 4. UI Consistency Improvements
- [ ] Match participant representation between time and location sections
  - [ ] Use consistent styling for "You" row/column (currently grey in times, red in locations)
  - [ ] Align default vote states ("?" vs undefined)
  - [ ] Standardize vote type initialization (yes/no/if-need-be)
- [ ] Maintain distinct but complementary layouts
  - [ ] Keep time voting's row-based layout for dates/times
  - [ ] Keep location voting's column-based layout for better space utilization
  - [ ] Ensure visual hierarchy makes sense with stacked layout
- [ ] Unify interaction patterns
  - [ ] Standardize hover states
  - [ ] Match click behaviors
  - [ ] Align feedback animations

### 5. Testing & Mobile
- [ ] Add unit tests for location voting components
- [ ] Test mobile responsiveness of table layout
- [ ] Test error cases and edge cases
- [ ] Test with large numbers of participants and locations
- [ ] Test voting flow across tabs
- [ ] Test vote synchronization between time and location sections

### 6. Future Enhancements
- [ ] Add map preview when location is expanded
- [ ] Add location search/filter capabilities
- [ ] Consider grouping locations by area/distance
- [ ] Add location sorting options
- [ ] Consider adding location categories/tags
- [ ] Add location suggestions based on popular venues
- [ ] Consider integration with map services for address validation

### 7. Documentation & Cleanup
- [ ] Add documentation for location voting features
- [ ] Clean up any remaining type issues
- [ ] Add comments for complex logic
- [ ] Update user guide with location voting instructions
- [ ] Document API changes for location voting
- [ ] Add migration guide for existing polls

Would you like me to start fixing the type errors or work on any of the polish items? 