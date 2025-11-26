<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
  import { db } from '$lib/firebase/config';
  import { vote, removeVote, getUserVote } from '$lib/services/voteService';
  import type { Report, Vote } from '$lib/types';

  export let report: Report;
  export let compact = false;

  // Real-time state
  let liveReport: Report = report;
  let userVote: Vote | null = null;
  let unsubscribe: Unsubscribe | null = null;

  // UI state
  let isVoting = false;

  // Format timestamp
  function formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  // Get severity color
  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Handle vote
  async function handleVote(voteType: 'up' | 'down') {
    if (isVoting) return;
    
    isVoting = true;
    try {
      if (userVote && userVote.voteType === voteType) {
        // Remove vote if clicking same button
        await removeVote(liveReport.id);
        userVote = null;
      } else {
        // Add or change vote
        await vote(liveReport.id, voteType);
        userVote = await getUserVote(liveReport.id);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      isVoting = false;
    }
  }

  onMount(async () => {
    // Subscribe to real-time updates
    const reportRef = doc(db, 'reports', report.id);
    unsubscribe = onSnapshot(reportRef, (snapshot) => {
      if (snapshot.exists()) {
        liveReport = {
          id: snapshot.id,
          ...snapshot.data()
        } as Report;
      }
    });

    // Get user's current vote
    try {
      userVote = await getUserVote(report.id);
    } catch (error) {
      console.error('Failed to get user vote:', error);
    }
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
</script>

<article class="report-card {compact ? 'compact' : ''}" aria-labelledby="report-title-{liveReport.id}">
  <!-- Header -->
  <div class="report-header">
    <div class="report-meta">
      <span class="author">{liveReport.authorName}</span>
      <span class="separator">•</span>
      <span class="timestamp">{formatTimestamp(liveReport.createdAt)}</span>
    </div>
    
    {#if liveReport.aiAnalysis}
      <div class="severity-badge {getSeverityColor(liveReport.aiAnalysis.severity)}">
        {liveReport.aiAnalysis.severity.toUpperCase()}
      </div>
    {/if}
  </div>

  <!-- Title -->
  <h3 id="report-title-{liveReport.id}" class="report-title">{liveReport.title}</h3>

  <!-- Crime Type -->
  <div class="crime-type-badge">
    {liveReport.crimeType}
  </div>

  <!-- Description -->
  {#if !compact}
    <p class="report-description">{liveReport.description}</p>
  {:else}
    <p class="report-description">
      {liveReport.description.length > 150 
        ? liveReport.description.substring(0, 150) + '...' 
        : liveReport.description}
    </p>
  {/if}

  <!-- Location Info with Mini Map -->
  {#if liveReport.location}
    <div class="location-info">
      <div class="location-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span class="location-label">Location</span>
      </div>
      
      <!-- Static Map Preview using OpenStreetMap -->
      {#if !compact}
        <div class="mini-map-container">
          <a 
            href="https://www.google.com/maps?q={liveReport.location.latitude},{liveReport.location.longitude}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="mini-map-link"
            title="Click to view on Google Maps"
          >
            <img 
              src="https://staticmap.openstreetmap.de/staticmap.php?center={liveReport.location.latitude},{liveReport.location.longitude}&zoom=15&size=400x120&markers={liveReport.location.latitude},{liveReport.location.longitude},red-pushpin"
              alt="Location map showing crime report at {liveReport.location.address || `${liveReport.location.latitude.toFixed(4)}, ${liveReport.location.longitude.toFixed(4)}`}"
              class="mini-map-image"
              loading="lazy"
            />
            <div class="mini-map-overlay">
              <span>📍 View on Map</span>
            </div>
          </a>
        </div>
      {/if}
      
      {#if liveReport.location.address}
        <p class="location-address">{liveReport.location.address}</p>
      {:else}
        <p class="location-coords">
          {liveReport.location.latitude.toFixed(4)}, {liveReport.location.longitude.toFixed(4)}
        </p>
      {/if}
      {#if !compact}
        <a 
          href="https://www.google.com/maps?q={liveReport.location.latitude},{liveReport.location.longitude}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="view-map-link"
        >
          View on Google Maps
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      {/if}
    </div>
  {/if}

  <!-- AI Analysis -->
  {#if liveReport.aiAnalysis && !compact}
    <div class="ai-analysis">
      <h4 class="ai-analysis-title">AI Analysis</h4>
      <p class="ai-summary">{liveReport.aiAnalysis.summary}</p>
      {#if liveReport.aiAnalysis.categories.length > 0}
        <div class="categories">
          {#each liveReport.aiAnalysis.categories as category}
            <span class="category-tag">{category}</span>
          {/each}
        </div>
      {/if}
      <p class="confidence">
        Confidence: {Math.round(liveReport.aiAnalysis.confidence * 100)}%
      </p>
    </div>
  {/if}

  <!-- Media Thumbnails -->
  {#if liveReport.mediaUrls && liveReport.mediaUrls.length > 0}
    <div class="media-thumbnails">
      {#each liveReport.mediaUrls.slice(0, compact ? 2 : 4) as mediaUrl, index}
        <div class="thumbnail">
          <img src={mediaUrl} alt="Evidence {index + 1}" />
        </div>
      {/each}
      {#if liveReport.mediaUrls.length > (compact ? 2 : 4)}
        <div class="thumbnail more-indicator">
          +{liveReport.mediaUrls.length - (compact ? 2 : 4)}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Footer with Voting -->
  <footer class="report-footer">
    <div class="vote-buttons" role="group" aria-label="Vote on this report">
      <button
        class="vote-btn upvote {userVote?.voteType === 'up' ? 'active' : ''}"
        on:click={() => handleVote('up')}
        disabled={isVoting}
        aria-label="Upvote this report, current count: {liveReport.upvotes || 0}"
        aria-pressed={userVote?.voteType === 'up'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
        <span aria-hidden="true">{liveReport.upvotes || 0}</span>
      </button>

      <button
        class="vote-btn downvote {userVote?.voteType === 'down' ? 'active' : ''}"
        on:click={() => handleVote('down')}
        disabled={isVoting}
        aria-label="Downvote this report, current count: {liveReport.downvotes || 0}"
        aria-pressed={userVote?.voteType === 'down'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6"/>
        </svg>
        <span aria-hidden="true">{liveReport.downvotes || 0}</span>
      </button>
    </div>

    <div class="comment-count" aria-label="{liveReport.commentCount || 0} comments">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span>{liveReport.commentCount || 0} comments</span>
    </div>
  </footer>
</article>

<style>
  .report-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
    transition: box-shadow 0.2s;
  }

  .report-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .report-card.compact {
    padding: 1rem;
  }

  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .report-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .author {
    font-weight: 500;
    color: #374151;
  }

  .separator {
    color: #d1d5db;
  }

  .severity-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .report-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .crime-type-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background-color: #dbeafe;
    color: #1e40af;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
    text-transform: capitalize;
  }

  .report-description {
    color: #4b5563;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .location-info {
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
  }

  .location-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #0369a1;
    margin-bottom: 0.5rem;
  }

  .location-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .mini-map-container {
    margin-bottom: 0.75rem;
    border-radius: 0.375rem;
    overflow: hidden;
    border: 1px solid #bae6fd;
  }

  .mini-map-link {
    display: block;
    text-decoration: none;
    position: relative;
  }

  .mini-map-image {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  }

  .mini-map-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.6));
    color: white;
    padding: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .mini-map-link:hover .mini-map-overlay {
    opacity: 1;
  }

  .location-address {
    font-size: 0.875rem;
    color: #374151;
    margin: 0;
  }

  .location-coords {
    font-size: 0.8125rem;
    color: #6b7280;
    font-family: monospace;
    margin: 0;
  }

  .view-map-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    color: #0284c7;
    text-decoration: none;
    font-weight: 500;
  }

  .view-map-link:hover {
    color: #0369a1;
    text-decoration: underline;
  }

  .ai-analysis {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .ai-analysis-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .ai-summary {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .categories {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .category-tag {
    padding: 0.25rem 0.5rem;
    background-color: #e0e7ff;
    color: #4338ca;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .confidence {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .media-thumbnails {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .thumbnail {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    border-radius: 0.5rem;
    overflow: hidden;
    background-color: #f3f4f6;
  }

  .thumbnail img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumbnail.more-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e5e7eb;
    color: #6b7280;
    font-weight: 600;
    font-size: 1.25rem;
    padding-bottom: 0;
  }

  .report-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .vote-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .vote-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background-color: white;
    color: #6b7280;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .vote-btn:hover:not(:disabled) {
    background-color: #f9fafb;
  }

  .vote-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .vote-btn.upvote.active {
    background-color: #dbeafe;
    border-color: #3b82f6;
    color: #1e40af;
  }

  .vote-btn.downvote.active {
    background-color: #fee2e2;
    border-color: #ef4444;
    color: #991b1b;
  }

  .comment-count {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
  }

  @media (max-width: 640px) {
    .report-card {
      padding: 1rem;
    }

    .report-title {
      font-size: 1.125rem;
    }

    .vote-btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      min-height: 44px;
    }

    .report-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .report-footer {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .vote-buttons {
      width: 100%;
    }

    .vote-btn {
      flex: 1;
      justify-content: center;
    }
  }

  /* Touch-friendly vote buttons */
  @media (pointer: coarse) {
    .vote-btn {
      min-height: 44px;
      min-width: 44px;
    }
  }

  /* Focus visible styles */
  .vote-btn:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
</style>
