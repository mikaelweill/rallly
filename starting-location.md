# Starting Location Feature Specification

## Overview
The Starting Location feature allows participants to set their starting location for optimized venue selection. This document outlines the improved UX flow and implementation details.

## Map Display Rules

### 1. Visibility ✅
- [x] Map should be visible to BOTH administrators and voters
- [x] Map input sections (address bar, transport mode, etc.) should only be visible when in voting mode (new/edit)
- [x] Map input sections appear automatically when clicking the "+" to add/edit votes

### 2. Positioning ✅
For Non-Optimized Polls:
- [x] Map appears ABOVE the voting section
- [x] This applies to both admin and voter views

For Optimized Polls:
- [x] Map appears BELOW the voting section
- [x] This applies to both admin and voter views

## Implementation Status

### Phase 1: Map Visibility & Position ✅
- [x] Ensure map is visible in admin view
- [x] Add map to voter view
- [x] Position map correctly based on poll type:
  - Non-optimized: Above voting section
  - Optimized: Below voting section
- [x] Integrate map with voting form structure
  - Map is now properly nested inside VotingForm
  - Save/Cancel buttons appear below both map and voting sections

### Phase 2: Voting Form Integration ✅
- [x] Tie map input sections to voting form state
- [x] Show/hide input sections based on voting mode
- [x] Handle location state in voting form context
- [x] Implement pin dropping and saving functionality

### Phase 3: Location Display & Storage ✅
- [x] Add starting location to confirmation screen for optimized polls
- [x] Add location data to database schema and migrations
- [x] Update admin view to display saved locations from DB
- [x] Ensure consistent location handling between admin and voter views for:
  - Optimized polls
  - Non-optimized polls

### Phase 4: Data Integration ✅
- [x] Update mutation to handle location with votes
- [x] Add optimistic updates
- [x] Handle error states
- [x] Add loading states

### Phase 5: Ordering & UX Improvements (In Progress)
- [x] Fix chronological ordering of locations (oldest first)
- [x] Ensure pins and addresses match in order
- [x] Clear temporary locations after saving
- [ ] Add visual feedback when location is saved
- [ ] Add loading state during geocoding
- [ ] Improve error messages for geocoding failures

### Phase 6: Mobile Optimization (Pending)
- [ ] Optimize map controls for mobile
- [ ] Improve touch interaction for pin dropping
- [ ] Ensure responsive layout on small screens
- [ ] Add mobile-specific error states and feedback

## Current Issues Fixed
1. ✅ Location ordering now shows in chronological order (oldest first)
2. ✅ Pins and addresses now match in numbering
3. ✅ Temporary locations are cleared after saving
4. ✅ Database fetches participants in correct order

## Next Steps
1. Add visual feedback:
   - Loading indicator during geocoding
   - Success animation when location is saved
   - Clear error states for various failure modes
2. Mobile optimization:
   - Touch-friendly controls
   - Responsive layout improvements
   - Mobile-specific UX patterns
3. Performance improvements:
   - Optimize re-renders
   - Cache geocoding results
   - Lazy load map components

## Notes
- All location operations should be cancelable via the voting form
- Clear visual distinction between temporary and confirmed locations
- Maintain existing vote data when adding/updating location
- Consider mobile-friendly interactions for map
- Add proper error handling for geocoding failures
- Ensure consistent behavior between admin and voter views

## UI Components

### Map Component
```typescript
interface MapProps {
  mode: 'view' | 'edit';
  temporaryLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  confirmedLocations: Array<{
    id: string;
    lat: number;
    lng: number;
    address: string;
    participantName: string;
  }>;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}
```

### Location Input Component
```typescript
interface LocationInputProps {
  value: string;
  onChange: (address: string) => void;
  onLocationSelect: (location: { 
    address: string;
    lat: number;
    lng: number;
  }) => void;
  isEditing: boolean;
}
```

## Integration with Voting

### Key Changes
1. ✅ Tie map input visibility to voting form state
2. ✅ Save location along with votes in single transaction
3. ✅ Show/hide input sections based on voting form mode (new/edit/view)
4. ✅ Position map based on poll optimization status

### Data Structure
```typescript
interface ParticipantSubmission {
  votes: Array<{
    optionId: string;
    type: VoteType;
  }>;
  startLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}
``` 