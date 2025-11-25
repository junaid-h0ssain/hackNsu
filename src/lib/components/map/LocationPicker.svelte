<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { Location } from '$lib/types';
  import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '$lib/utils/constants';
  import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

  export let initialLocation: Location | null = null;

  const dispatch = createEventDispatcher<{ select: Location }>();

  let mapContainer: HTMLDivElement;
  let map: LeafletMap | null = null;
  let marker: LeafletMarker | null = null;
  let selectedLocation: Location | null = initialLocation;
  let L: typeof import('leaflet') | null = null;

  onMount(async () => {
    // Dynamically import Leaflet to avoid SSR issues
    L = await import('leaflet');
    
    // Import Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Initialize map
    const center = initialLocation 
      ? [initialLocation.latitude, initialLocation.longitude] as [number, number]
      : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng] as [number, number];

    map = L.map(mapContainer).setView(center, DEFAULT_MAP_ZOOM);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Add initial marker if location provided
    if (initialLocation) {
      marker = L.marker([initialLocation.latitude, initialLocation.longitude]).addTo(map);
    }

    // Add click handler to select location
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      selectedLocation = {
        latitude: lat,
        longitude: lng
      };

      // Remove existing marker
      if (marker && map) {
        map.removeLayer(marker);
      }

      // Add new marker
      if (L && map) {
        marker = L.marker([lat, lng]).addTo(map);
      }

      // Emit location selection event
      dispatch('select', selectedLocation);
    });
  });

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });
</script>

<div class="location-picker" role="application" aria-label="Location picker map">
  <p class="sr-only" id="location-picker-instructions">
    Click or tap on the map to select a location. The selected coordinates will be displayed below the map.
  </p>
  <div 
    bind:this={mapContainer} 
    class="map-container"
    aria-describedby="location-picker-instructions"
    tabindex="0"
  ></div>
  {#if selectedLocation}
    <div class="coordinates-display" role="status" aria-live="polite">
      <p class="text-sm text-gray-600">
        <span class="sr-only">Selected location coordinates:</span>
        Selected Location: 
        <span class="font-mono">
          {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
        </span>
      </p>
    </div>
  {:else}
    <div class="coordinates-display">
      <p class="text-sm text-gray-500">Click or tap on the map to select a location</p>
    </div>
  {/if}
</div>

<style>
  .location-picker {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .map-container {
    flex: 1;
    min-height: 300px;
    width: 100%;
    border-radius: 0.5rem 0.5rem 0 0;
    overflow: hidden;
  }

  /* Responsive map height */
  @media (min-width: 640px) {
    .map-container {
      min-height: 400px;
    }
  }

  .coordinates-display {
    padding: 0.75rem 1rem;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
    border-radius: 0 0 0.5rem 0.5rem;
  }

  /* Touch-friendly map controls */
  :global(.leaflet-control-zoom a) {
    width: 44px !important;
    height: 44px !important;
    line-height: 44px !important;
    font-size: 20px !important;
  }

  :global(.leaflet-control-zoom a:focus) {
    outline: 2px solid #3b82f6 !important;
    outline-offset: 2px !important;
  }

  /* Screen reader only class */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
