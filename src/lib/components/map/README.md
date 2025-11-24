# Map Components

This directory contains Leaflet-based map components for the Crime Reporting Platform.

## Components

### LocationPicker

A map component that allows users to select a location by clicking on the map.

**Props:**
- `initialLocation?: Location | null` - Optional initial location to display

**Events:**
- `select: Location` - Emitted when a location is selected on the map

**Usage:**
```svelte
<script>
  import { LocationPicker } from '$lib/components/map';
  
  let selectedLocation = null;
  
  function handleLocationSelect(event) {
    selectedLocation = event.detail;
    console.log('Selected:', selectedLocation);
  }
</script>

<LocationPicker 
  initialLocation={selectedLocation}
  on:select={handleLocationSelect}
/>
```

### CrimeMap

An interactive map that displays crime reports with marker clustering for performance.

**Props:**
- `reports: Report[]` - Array of crime reports to display
- `center?: { lat: number; lng: number }` - Map center (defaults to DEFAULT_MAP_CENTER)

**Events:**
- `markerClick: string` - Emitted when a marker is clicked, passes the report ID

**Usage:**
```svelte
<script>
  import { CrimeMap } from '$lib/components/map';
  import { reportsStore } from '$lib/stores/reportsStore';
  
  function handleMarkerClick(event) {
    const reportId = event.detail;
    console.log('Clicked report:', reportId);
    // Navigate to report details or open modal
  }
</script>

<CrimeMap 
  reports={$reportsStore}
  center={{ lat: 23.8103, lng: 90.4125 }}
  on:markerClick={handleMarkerClick}
/>
```

## Features

### LocationPicker
- Click anywhere on the map to select a location
- Displays selected coordinates in a readable format
- Shows a marker at the selected location
- Supports initial location prop for editing existing reports

### CrimeMap
- Displays all crime reports as markers on the map
- Color-coded markers based on AI-analyzed severity:
  - 🟢 Green: Low severity
  - 🟡 Yellow: Medium severity
  - 🔴 Red: High severity
- Marker clustering for performance with 50+ markers
- Interactive popups showing:
  - Report title and description
  - Crime type
  - AI severity level
  - Vote counts (upvotes/downvotes)
  - Report date
- Real-time updates when reports change
- Click markers to trigger navigation or actions

## Dependencies

- `leaflet` - Core mapping library
- `leaflet.markercluster` - Marker clustering for performance
- OpenStreetMap tiles (loaded from CDN)

## Styling

Both components use scoped styles and can be customized via CSS. The map containers have minimum heights:
- LocationPicker: 400px minimum
- CrimeMap: 500px minimum

Global styles for popups are defined with `:global()` selectors and can be overridden in your app's global CSS.
