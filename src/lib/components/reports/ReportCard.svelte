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

<div class="report-card {compact ? 'compact' : ''}">
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
  <h3 class="report-title">{liveReport.title}</h3>

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
  <div class="report-footer">
    <div class="vote-buttons">
      <button
        class="vote-btn upvote {userVote?.voteType === 'up' ? 'active' : ''}"
        on:click={() => handleVote('up')}
        disabled={isVoting}
        aria-label="Upvote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
        <span>{liveReport.upvotes || 0}</span>
      </button>

      <button
        class="vote-btn downvote {userVote?.voteType === 'down' ? 'active' : ''}"
        on:click={() => handleVote('down')}
        disabled={isVoting}
        aria-label="Downvote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
        <span>{liveReport.downvotes || 0}</span>
      </button>
    </div>

    <div class="comment-count">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span>{liveReport.commentCount || 0} comments</span>
    </div>
  </div>
</div>

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
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }
  }
</style>
