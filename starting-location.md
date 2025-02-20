# Starting Location Feature Specification

## Overview
The Starting Location feature allows participants to set their starting location for optimized venue selection. This document outlines the improved UX flow and implementation details.

## Map Display Rules

### 1. Visibility
- Map should be visible to BOTH administrators and voters
- Currently only visible to admins, needs to be added for voters

### 2. Positioning
For Non-Optimized Polls:
- Map appears ABOVE the voting section
- This applies to both admin and voter views

For Optimized Polls:
- Map appears BELOW the voting section
- This applies to both admin and voter views

## User Experience Flow

### 1. Initial State
- Map section appears based on poll type:
  - Non-Optimized: ABOVE voting section
  - Optimized: BELOW voting section
- Map is initially in view-only mode showing existing participant locations (if any)
- No input fields are shown initially
- Clear "+" button to start adding location

### 2. Location Input Flow
When user clicks "+" button:
1. Location input section appears with:
   - Search bar with Google Places autocomplete
   - "Use current location" button
   - Map becomes interactive
   - Clear "Cancel" and "Save" buttons

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
   - Clicking "Save":
     - Locks the address
     - Adds numbered marker to map
     - Adds entry to participant list
     - Returns to view-only mode
   - Clicking "Cancel":
     - Removes temporary pin
     - Clears input
     - Returns to view-only mode

### 3. Post-Confirmation State
- Location appears in participant list with:
  - Numbered marker matching map
  - Participant name
  - Address
- Clear "Edit" and "Remove" options
- Map shows confirmed location with permanent marker style

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
1. Move location section below voting section
2. Only allow location input after clicking "+"
3. Save location along with votes in single transaction
4. Update UI to show clear connection between votes and location

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

### Phase 1: Map Visibility
- [ ] Add map component to voter view (desktop-poll.tsx)
- [ ] Ensure map visibility for both admin and voter views
- [ ] Position map correctly based on poll type:
  - Non-optimized: Above voting section
  - Optimized: Below voting section

### Phase 2: UI Restructuring
- [ ] Move map based on poll type
- [ ] Implement view/edit modes for map
- [ ] Add temporary pin state
- [ ] Update marker styling

### Phase 3: Input Flow
- [ ] Add "+" button trigger
- [ ] Implement immediate pin dropping
- [ ] Add confirmation flow
- [ ] Handle pin dragging

### Phase 4: Data Integration
- [ ] Update mutation to handle location with votes
- [ ] Add optimistic updates
- [ ] Handle error states
- [ ] Add loading states

## Notes
- All location operations should be cancelable
- Clear visual distinction between temporary and confirmed locations
- Maintain existing vote data when adding/updating location
- Consider mobile-friendly interactions for map
- Add proper error handling for geocoding failures
- Ensure consistent behavior between admin and voter views 