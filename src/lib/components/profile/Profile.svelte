<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, authLoading } from '$lib/stores/authStore';
  import { getUserProfile, updateProfile, getUserReports, getUserActivity, type UserProfile, type UpdateProfileInput, type UserActivity } from '$lib/services/profileService';
  import type { Report } from '$lib/types';

  // Component state
  let profile: UserProfile | null = null;
  let userReports: Report[] = [];
  let userActivity: UserActivity = { votes: [], comments: [] };
  let isLoading = true;
  let errorMessage = '';
  let successMessage = '';

  // Edit mode state
  let isEditing = false;
  let isSaving = false;
  let editForm: UpdateProfileInput = {
    displayName: '',
    email: '',
    phoneNumber: ''
  };

  // Active tab
  let activeTab: 'reports' | 'votes' | 'comments' = 'reports';

  // Load profile data
  async function loadProfile() {
    if (!$currentUser) return;

    isLoading = true;
    errorMessage = '';

    try {
      profile = await getUserProfile($currentUser.uid);
      userReports = await getUserReports($currentUser.uid);
      userActivity = await getUserActivity($currentUser.uid);
      
      // Initialize edit form
      editForm = {
        displayName: profile.displayName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || ''
      };
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      errorMessage = error.message || 'Failed to load profile';
    } finally {
      isLoading = false;
    }
  }

  // Start editing
  function startEditing() {
    if (profile) {
      editForm = {
        displayName: profile.displayName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || ''
      };
    }
    isEditing = true;
    errorMessage = '';
    successMessage = '';
  }

  // Cancel editing
  function cancelEditing() {
    isEditing = false;
    if (profile) {
      editForm = {
        displayName: profile.displayName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || ''
      };
    }
  }

  // Save profile changes
  async function saveProfile() {
    isSaving = true;
    errorMessage = '';
    successMessage = '';

    try {
      await updateProfile(editForm);
      successMessage = 'Profile updated successfully';
      isEditing = false;
      
      // Reload profile to get updated data
      await loadProfile();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      errorMessage = error.message || 'Failed to update profile';
    } finally {
      isSaving = false;
    }
  }

  // Format timestamp
  function formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }

  // Get role badge class
  function getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'badge-admin';
      case 'moderator': return 'badge-moderator';
      default: return 'badge-citizen';
    }
  }

  // Get severity color
  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-default';
    }
  }

  onMount(() => {
    if ($currentUser) {
      loadProfile();
    }
  });

  // Reload when user changes
  $: if ($currentUser && !$authLoading) {
    loadProfile();
  }
</script>


{#if $authLoading}
  <div class="loading-state">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
{:else if !$currentUser}
  <div class="not-authenticated">
    <h3>Not Authenticated</h3>
    <p>Please log in to view your profile.</p>
  </div>
{:else if isLoading}
  <div class="loading-state">
    <div class="spinner"></div>
    <p>Loading profile...</p>
  </div>
{:else if errorMessage && !profile}
  <div class="error-state">
    <p>{errorMessage}</p>
    <button class="btn btn-primary" on:click={loadProfile}>Retry</button>
  </div>
{:else if profile}
  <div class="profile-container">
    <!-- Profile Header -->
    <div class="profile-header">
      <div class="profile-avatar">
        {(profile.displayName || profile.email || 'U')[0].toUpperCase()}
      </div>
      <div class="profile-info">
        <h1 class="profile-name">{profile.displayName || 'Anonymous User'}</h1>
        <span class="role-badge {getRoleBadgeClass(profile.role)}">{profile.role}</span>
      </div>
      {#if !isEditing}
        <button class="btn btn-secondary" on:click={startEditing}>
          Edit Profile
        </button>
      {/if}
    </div>

    <!-- Success/Error Messages -->
    {#if successMessage}
      <div class="success-banner">{successMessage}</div>
    {/if}
    {#if errorMessage}
      <div class="error-banner">{errorMessage}</div>
    {/if}

    <!-- Profile Details / Edit Form -->
    <div class="profile-card">
      <h2 class="card-title">Profile Information</h2>
      
      {#if isEditing}
        <form on:submit|preventDefault={saveProfile} class="edit-form">
          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              bind:value={editForm.displayName}
              placeholder="Enter your display name"
            />
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              bind:value={editForm.email}
              placeholder="Enter your email"
            />
          </div>
          
          <div class="form-group">
            <label for="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              bind:value={editForm.phoneNumber}
              placeholder="Enter your phone number"
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={cancelEditing} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      {:else}
        <div class="profile-details">
          <div class="detail-row">
            <span class="detail-label">Display Name</span>
            <span class="detail-value">{profile.displayName || 'Not set'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">{profile.email || 'Not set'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone</span>
            <span class="detail-value">{profile.phoneNumber || 'Not set'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Role</span>
            <span class="detail-value capitalize">{profile.role}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Member Since</span>
            <span class="detail-value">{formatTimestamp(profile.createdAt)}</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Activity Tabs -->
    <div class="activity-section">
      <div class="tabs">
        <button
          class="tab {activeTab === 'reports' ? 'active' : ''}"
          on:click={() => activeTab = 'reports'}
        >
          Reports ({userReports.length})
        </button>
        <button
          class="tab {activeTab === 'votes' ? 'active' : ''}"
          on:click={() => activeTab = 'votes'}
        >
          Votes ({userActivity.votes.length})
        </button>
        <button
          class="tab {activeTab === 'comments' ? 'active' : ''}"
          on:click={() => activeTab = 'comments'}
        >
          Comments ({userActivity.comments.length})
        </button>
      </div>

      <div class="tab-content">
        {#if activeTab === 'reports'}
          {#if userReports.length === 0}
            <div class="empty-state">
              <p>You haven't submitted any reports yet.</p>
            </div>
          {:else}
            <div class="reports-list">
              {#each userReports as report (report.id)}
                <div class="report-item">
                  <div class="report-item-header">
                    <h3 class="report-item-title">{report.title}</h3>
                    {#if report.aiAnalysis}
                      <span class="severity-badge {getSeverityColor(report.aiAnalysis.severity)}">
                        {report.aiAnalysis.severity}
                      </span>
                    {/if}
                  </div>
                  <p class="report-item-description">
                    {report.description.length > 150 
                      ? report.description.substring(0, 150) + '...' 
                      : report.description}
                  </p>
                  <div class="report-item-meta">
                    <span class="crime-type">{report.crimeType}</span>
                    <span class="separator">•</span>
                    <span>{formatTimestamp(report.createdAt)}</span>
                    <span class="separator">•</span>
                    <span>{report.upvotes} upvotes, {report.downvotes} downvotes</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else if activeTab === 'votes'}
          {#if userActivity.votes.length === 0}
            <div class="empty-state">
              <p>You haven't voted on any reports yet.</p>
            </div>
          {:else}
            <div class="activity-list">
              {#each userActivity.votes as vote (vote.id)}
                <div class="activity-item">
                  <div class="vote-icon {vote.voteType}">
                    {#if vote.voteType === 'up'}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 15l-6-6-6 6"/>
                      </svg>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    {/if}
                  </div>
                  <div class="activity-details">
                    <p class="activity-title">
                      {vote.voteType === 'up' ? 'Upvoted' : 'Downvoted'}: {vote.reportTitle || 'Unknown Report'}
                    </p>
                    <span class="activity-time">{formatTimestamp(vote.createdAt)}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else if activeTab === 'comments'}
          {#if userActivity.comments.length === 0}
            <div class="empty-state">
              <p>You haven't commented on any reports yet.</p>
            </div>
          {:else}
            <div class="activity-list">
              {#each userActivity.comments as comment (comment.id)}
                <div class="activity-item">
                  <div class="comment-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div class="activity-details">
                    <p class="activity-title">
                      Commented on: {comment.reportTitle || 'Unknown Report'}
                    </p>
                    <p class="comment-text">"{comment.text}"</p>
                    <span class="activity-time">{formatTimestamp(comment.createdAt)}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}


<style>
  .profile-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .loading-state,
  .not-authenticated,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    color: #6b7280;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .not-authenticated h3,
  .error-state h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  /* Profile Header */
  .profile-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
  }

  .profile-info {
    flex: 1;
  }

  .profile-name {
    font-size: 1.75rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .role-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .badge-admin {
    background-color: #fef3c7;
    color: #92400e;
  }

  .badge-moderator {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .badge-citizen {
    background-color: #f3f4f6;
    color: #374151;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .btn-secondary {
    background-color: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: #f9fafb;
  }

  /* Banners */
  .success-banner,
  .error-banner {
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
  }

  .success-banner {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .error-banner {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  /* Profile Card */
  .profile-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .card-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1.5rem 0;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  /* Profile Details */
  .profile-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
  }

  .detail-label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .detail-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
  }

  .capitalize {
    text-transform: capitalize;
  }

  /* Edit Form */
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .form-group input {
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  /* Activity Section */
  .activity-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
  }

  .tab {
    flex: 1;
    padding: 1rem;
    background: none;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
  }

  .tab:hover {
    color: #374151;
    background-color: #f9fafb;
  }

  .tab.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }

  .tab-content {
    padding: 1.5rem;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  /* Reports List */
  .reports-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .report-item {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    transition: box-shadow 0.2s;
  }

  .report-item:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .report-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .report-item-title {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .severity-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .severity-high {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .severity-medium {
    background-color: #fef3c7;
    color: #92400e;
  }

  .severity-low {
    background-color: #d1fae5;
    color: #065f46;
  }

  .severity-default {
    background-color: #f3f4f6;
    color: #374151;
  }

  .report-item-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 0.75rem 0;
    line-height: 1.5;
  }

  .report-item-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .crime-type {
    padding: 0.125rem 0.5rem;
    background-color: #dbeafe;
    color: #1e40af;
    border-radius: 0.25rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .separator {
    color: #d1d5db;
  }

  /* Activity List */
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .activity-item {
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .vote-icon,
  .comment-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .vote-icon.up {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .vote-icon.down {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .comment-icon {
    background-color: #f3f4f6;
    color: #6b7280;
  }

  .activity-details {
    flex: 1;
    min-width: 0;
  }

  .activity-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .comment-text {
    font-size: 0.8125rem;
    color: #6b7280;
    margin: 0 0 0.25rem 0;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .activity-time {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .profile-container {
      padding: 1rem;
    }

    .profile-header {
      flex-direction: column;
      text-align: center;
    }

    .profile-avatar {
      width: 64px;
      height: 64px;
      font-size: 1.5rem;
    }

    .profile-name {
      font-size: 1.5rem;
    }

    .tabs {
      flex-wrap: wrap;
    }

    .tab {
      flex: 1 1 auto;
      min-width: 33%;
    }

    .report-item-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .report-item-meta {
      flex-wrap: wrap;
    }
  }
</style>
