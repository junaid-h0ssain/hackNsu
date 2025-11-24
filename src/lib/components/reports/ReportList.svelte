<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { subscribeToReports } from '$lib/services/reportService';
  import ReportCard from './ReportCard.svelte';
  import type { Report, FilterOptions } from '$lib/types';
  import type { Unsubscribe } from 'firebase/firestore';
  import { REPORTS_PER_PAGE } from '$lib/utils/constants';

  // Props
  export let filters: FilterOptions = {};

  // State
  let reports: Report[] = [];
  let displayedReports: Report[] = [];
  let currentPage = 1;
  let totalPages = 1;
  let isLoading = true;
  let unsubscribe: Unsubscribe | null = null;

  // Filter state
  let selectedCrimeType = filters.crimeType || '';
  let startDate = filters.startDate ? formatDateForInput(filters.startDate) : '';
  let endDate = filters.endDate ? formatDateForInput(filters.endDate) : '';
  let showFilters = false;

  // Crime type options
  const crimeTypes = [
    { value: '', label: 'All Types' },
    { value: 'theft', label: 'Theft' },
    { value: 'assault', label: 'Assault' },
    { value: 'vandalism', label: 'Vandalism' },
    { value: 'burglary', label: 'Burglary' },
    { value: 'fraud', label: 'Fraud' },
    { value: 'robbery', label: 'Robbery' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'other', label: 'Other' }
  ];

  function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function updateDisplayedReports() {
    const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
    const endIndex = startIndex + REPORTS_PER_PAGE;
    displayedReports = reports.slice(startIndex, endIndex);
    totalPages = Math.ceil(reports.length / REPORTS_PER_PAGE);
  }

  function applyFilters() {
    const newFilters: FilterOptions = {
      status: 'active'
    };

    if (selectedCrimeType) {
      newFilters.crimeType = selectedCrimeType;
    }

    if (startDate) {
      newFilters.startDate = new Date(startDate);
    }

    if (endDate) {
      newFilters.endDate = new Date(endDate);
    }

    // Unsubscribe from previous subscription
    if (unsubscribe) {
      unsubscribe();
    }

    // Reset pagination
    currentPage = 1;
    isLoading = true;

    // Subscribe with new filters
    unsubscribe = subscribeToReports(newFilters, (updatedReports) => {
      reports = updatedReports;
      updateDisplayedReports();
      isLoading = false;
    });
  }

  function clearFilters() {
    selectedCrimeType = '';
    startDate = '';
    endDate = '';
    applyFilters();
  }

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    updateDisplayedReports();
    
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextPage() {
    goToPage(currentPage + 1);
  }

  function previousPage() {
    goToPage(currentPage - 1);
  }

  onMount(() => {
    // Initial subscription
    unsubscribe = subscribeToReports(filters, (updatedReports) => {
      reports = updatedReports;
      updateDisplayedReports();
      isLoading = false;
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
</script>

<div class="report-list">
  <!-- Filter Section -->
  <div class="filter-section">
    <div class="filter-header">
      <h2 class="text-xl font-bold">Crime Reports</h2>
      <button
        class="filter-toggle"
        on:click={() => showFilters = !showFilters}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        {showFilters ? 'Hide' : 'Show'} Filters
      </button>
    </div>

    {#if showFilters}
      <div class="filter-controls">
        <div class="filter-row">
          <!-- Crime Type Filter -->
          <div class="filter-group">
            <label for="crimeType" class="filter-label">Crime Type</label>
            <select
              id="crimeType"
              bind:value={selectedCrimeType}
              class="filter-input"
            >
              {#each crimeTypes as type}
                <option value={type.value}>{type.label}</option>
              {/each}
            </select>
          </div>

          <!-- Start Date Filter -->
          <div class="filter-group">
            <label for="startDate" class="filter-label">From Date</label>
            <input
              id="startDate"
              type="date"
              bind:value={startDate}
              class="filter-input"
            />
          </div>

          <!-- End Date Filter -->
          <div class="filter-group">
            <label for="endDate" class="filter-label">To Date</label>
            <input
              id="endDate"
              type="date"
              bind:value={endDate}
              class="filter-input"
            />
          </div>
        </div>

        <div class="filter-actions">
          <button
            class="btn btn-primary"
            on:click={applyFilters}
          >
            Apply Filters
          </button>
          <button
            class="btn btn-secondary"
            on:click={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Results Summary -->
  <div class="results-summary">
    {#if isLoading}
      <p class="text-gray-600">Loading reports...</p>
    {:else}
      <p class="text-gray-600">
        Showing {displayedReports.length} of {reports.length} reports
        {#if currentPage > 1}
          (Page {currentPage} of {totalPages})
        {/if}
      </p>
    {/if}
  </div>

  <!-- Report Cards -->
  {#if isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading reports...</p>
    </div>
  {:else if displayedReports.length === 0}
    <div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <h3>No reports found</h3>
      <p>Try adjusting your filters or check back later.</p>
    </div>
  {:else}
    <div class="reports-grid">
      {#each displayedReports as report (report.id)}
        <ReportCard {report} />
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="pagination">
        <button
          class="pagination-btn"
          on:click={previousPage}
          disabled={currentPage === 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Previous
        </button>

        <div class="pagination-info">
          <span class="current-page">Page {currentPage}</span>
          <span class="page-separator">of</span>
          <span class="total-pages">{totalPages}</span>
        </div>

        <button
          class="pagination-btn"
          on:click={nextPage}
          disabled={currentPage === totalPages}
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .report-list {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .filter-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .filter-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    color: #374151;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-toggle:hover {
    background-color: #e5e7eb;
  }

  .filter-controls {
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .filter-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
  }

  .filter-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .filter-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .filter-input:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px;
    ring-color: #93c5fd;
  }

  .filter-actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn {
    padding: 0.5rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
    border: none;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }

  .btn-secondary {
    background-color: white;
    color: #6b7280;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover {
    background-color: #f9fafb;
  }

  .results-summary {
    margin-bottom: 1rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: #6b7280;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: #6b7280;
  }

  .empty-state svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .reports-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
  }

  .pagination-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    color: #374151;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pagination-btn:hover:not(:disabled) {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .current-page {
    font-weight: 600;
    color: #374151;
  }

  @media (max-width: 768px) {
    .report-list {
      padding: 1rem 0.5rem;
    }

    .filter-section {
      padding: 1rem;
    }

    .filter-row {
      grid-template-columns: 1fr;
    }

    .filter-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }

    .pagination {
      flex-direction: column;
      gap: 1rem;
    }

    .pagination-btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>
