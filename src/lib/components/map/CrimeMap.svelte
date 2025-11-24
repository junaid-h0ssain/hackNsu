<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { Report } from '$lib/types';
  import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MARKER_CLUSTERING_THRESHOLD } from '$lib/utils/constants';
  import type { Map as LeafletMap, Marker as LeafletMarker, MarkerClusterGroup } from 'leaflet';

  export let reports: Report[] = [];
  export let center: { lat: number; lng: number } = DEFAULT_MAP_CENTER;

  const dispatch = createEventDispatcher<{ markerClick: string }>();

  let mapContainer: HTMLDivElement;
  let map: LeafletMap | null = null;
  let markerClusterGroup: MarkerClusterGroup | null = null;
  let markers: Map<string, LeafletMarker> = new Map();
  let L: typeof import('leaflet') | null = null;
  let MarkerClusterGroupClass: typeof MarkerClusterGroup | null = null;

  onMount(async () => {
    // Dynamically import Leaflet and marker clustering to avoid SSR issues
    L = await import('leaflet');
    const markerClusterModule = await import('leaflet.markercluster');
    MarkerClusterGroupClass = (markerClusterModule as any).default || markerClusterModule;
    
    // Import Leaflet CSS
    const leafletLink = document.createElement('link');
    leafletLink.rel = 'stylesheet';
    leafletLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletLink);

    // Import MarkerCluster CSS
    const clusterLink = document.createElement('link');
    clusterLink.rel = 'stylesheet';
    clusterLink.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
    document.head.appendChild(clusterLink);

    const clusterDefaultLink = document.createElement('link');
    clusterDefaultLink.rel = 'stylesheet';
    clusterDefaultLink.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
    document.head.appendChild(clusterDefaultLink);

    // Initialize map
    map = L.map(mapContainer).setView([center.lat, center.lng], DEFAULT_MAP_ZOOM);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Initialize marker cluster group
    if (L.markerClusterGroup) {
      markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 80,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
      });
      map.addLayer(markerClusterGroup);
    }

    // Add initial markers
    updateMarkers();
  });

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
    markers.clear();
  });

  // Update markers when reports change
  $: if (map && L && markerClusterGroup) {
    updateMarkers();
  }

  function updateMarkers() {
    if (!map || !L || !markerClusterGroup) return;

    // Get current report IDs
    const currentReportIds = new Set(reports.map(r => r.id));
    
    // Remove markers for reports that no longer exist
    markers.forEach((marker, reportId) => {
      if (!currentReportIds.has(reportId)) {
        markerClusterGroup?.removeLayer(marker);
        markers.delete(reportId);
      }
    });

    // Add or update markers for current reports
    reports.forEach(report => {
      if (!L || !markerClusterGroup) return;

      const existingMarker = markers.get(report.id);
      
      if (existingMarker) {
        // Update existing marker popup
        existingMarker.setPopupContent(createPopupContent(report));
      } else {
        // Create new marker
        const marker = L.marker([report.location.latitude, report.location.longitude], {
          icon: createCustomIcon(report)
        });

        // Add popup with report details
        marker.bindPopup(createPopupContent(report));

        // Handle marker click
        marker.on('click', () => {
          dispatch('markerClick', report.id);
        });

        // Add to cluster group
        markerClusterGroup.addLayer(marker);
        markers.set(report.id, marker);
      }
    });
  }

  function createCustomIcon(report: Report) {
    if (!L) return undefined;

    const severityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444'
    };

    const color = report.aiAnalysis?.severity 
      ? severityColors[report.aiAnalysis.severity]
      : '#6b7280';

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  }

  function createPopupContent(report: Report): string {
    const date = report.createdAt?.toDate?.() || new Date();
    const formattedDate = date.toLocaleDateString();
    
    return `
      <div class="crime-popup">
        <h3 class="popup-title">${escapeHtml(report.title)}</h3>
        <p class="popup-type"><strong>Type:</strong> ${escapeHtml(report.crimeType)}</p>
        <p class="popup-description">${escapeHtml(report.description.substring(0, 100))}${report.description.length > 100 ? '...' : ''}</p>
        ${report.aiAnalysis ? `
          <p class="popup-severity">
            <strong>Severity:</strong> 
            <span class="severity-${report.aiAnalysis.severity}">${report.aiAnalysis.severity}</span>
          </p>
        ` : ''}
        <p class="popup-votes">
          <strong>Votes:</strong> 
          <span class="upvotes">↑ ${report.upvotes}</span> 
          <span class="downvotes">↓ ${report.downvotes}</span>
        </p>
        <p class="popup-date"><strong>Reported:</strong> ${formattedDate}</p>
      </div>
    `;
  }

  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
</script>

<div class="crime-map">
  <div bind:this={mapContainer} class="map-container"></div>
</div>

<style>
  .crime-map {
    width: 100%;
    height: 100%;
  }

  .map-container {
    width: 100%;
    height: 100%;
    min-height: 500px;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  :global(.crime-popup) {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 250px;
  }

  :global(.popup-title) {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: #111827;
  }

  :global(.popup-type),
  :global(.popup-severity),
  :global(.popup-votes),
  :global(.popup-date) {
    font-size: 0.875rem;
    margin: 0.25rem 0;
    color: #374151;
  }

  :global(.popup-description) {
    font-size: 0.875rem;
    margin: 0.5rem 0;
    color: #6b7280;
    line-height: 1.4;
  }

  :global(.severity-low) {
    color: #10b981;
    font-weight: 600;
    text-transform: capitalize;
  }

  :global(.severity-medium) {
    color: #f59e0b;
    font-weight: 600;
    text-transform: capitalize;
  }

  :global(.severity-high) {
    color: #ef4444;
    font-weight: 600;
    text-transform: capitalize;
  }

  :global(.upvotes) {
    color: #10b981;
    margin-right: 0.5rem;
  }

  :global(.downvotes) {
    color: #ef4444;
  }

  :global(.custom-marker) {
    background: transparent;
    border: none;
  }
</style>
