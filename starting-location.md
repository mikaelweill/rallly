# Starting Location Feature Specification

## Overview
The Starting Location feature allows participants to set their starting location for optimized venue selection. This document outlines the improved UX flow and implementation details.

## Map Display Rules

### 1. Visibility
- Map should be visible to BOTH administrators and voters
- Map input sections (address bar, transport mode, etc.) should only be visible when in voting mode (new/edit)
- Map input sections appear automatically when clicking the "+" to add/edit votes

### 2. Positioning
For Non-Optimized Polls:
- Map appears ABOVE the voting section
- This applies to both admin and voter views

For Optimized Polls:
- Map appears BELOW the voting section
- This applies to both admin and voter views

## User Experience Flow

### 1. Initial State (View Mode)
- Map section appears based on poll type:
  - Non-Optimized: ABOVE voting section
  - Optimized: BELOW voting section
- Map is in view-only mode showing existing participant locations (if any)
- No input fields are shown initially

### 2. Location Input Flow (Edit/New Mode)
When user clicks "+" to add/edit votes:
1. Location input section appears automatically with:
   - Search bar with Google Places autocomplete
   - "Use current location" button
   - Map becomes interactive
   - Transport mode selection (for non-optimized polls)

2. Pin Dropping Behavior:
   - Pin drops IMMEDIATELY when:
     - User selects an address from autocomplete
     - User clicks on map
     - User uses current location
   - Address field updates automatically when pin moves
   - Pin can be dragged to adjust location
   - Pin appears in a "temporary" style until confirmed

3. Confirmation Flow:
   - User reviews location with dropped pin
   - Location is saved along with votes when the voting form is submitted
   - Clicking "Cancel" on the voting form:
     - Removes temporary pin
     - Clears input
     - Returns to view-only mode

### 3. Post-Confirmation State
- Location appears in participant list with:
  - Numbered marker matching map
  - Participant name
  - Address
- Map returns to view-only mode

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
1. Tie map input visibility to voting form state
2. Save location along with votes in single transaction
3. Show/hide input sections based on voting form mode (new/edit/view)
4. Position map based on poll optimization status

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

## Implementation Phases

### Phase 1: Map Visibility & Position
- [ ] Ensure map is visible in both admin and voter views
- [ ] Position map correctly based on poll type:
  - Non-optimized: Above voting section
  - Optimized: Below voting section

### Phase 2: Voting Form Integration
- [ ] Tie map input sections to voting form state
- [ ] Show/hide input sections based on voting mode
- [ ] Handle location state in voting form context

### Phase 3: Input Flow
- [ ] Implement immediate pin dropping
- [ ] Add transport mode selection
- [ ] Handle pin dragging
- [ ] Update address field automatically

### Phase 4: Data Integration
- [ ] Update mutation to handle location with votes
- [ ] Add optimistic updates
- [ ] Handle error states
- [ ] Add loading states

## Notes
- All location operations should be cancelable via the voting form
- Clear visual distinction between temporary and confirmed locations
- Maintain existing vote data when adding/updating location
- Consider mobile-friendly interactions for map
- Add proper error handling for geocoding failures
- Ensure consistent behavior between admin and voter views 