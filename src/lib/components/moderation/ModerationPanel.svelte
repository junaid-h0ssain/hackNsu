<script lang="ts">
  import { flagReport, removeComment, suspendUser } from '$lib/services/moderationService';
  import { userRole } from '$lib/stores/authStore';
  import type { Report } from '$lib/types';

  export let reportId: string;
  export let report: Report | null = null;
  export let commentId: string | null = null;
  export let userId: string | null = null;
  export let targetType: 'report' | 'comment' | 'user' = 'report';

  // UI state
  let showConfirmDialog = false;
  let actionType: 'flag' | 'remove' | 'suspend' | null = null;
  let reason = '';
  let isProcessing = false;
  let errorMessage = '';
  let successMessage = '';

  // Check if user has moderator/admin role
  $: isModerator = $userRole === 'moderator' || $userRole === 'admin';

  // Open confirmation dialog
  function openConfirmDialog(action: 'flag' | 'remove' | 'suspend') {
    actionType = action;
    showConfirmDialog = true;
    reason = '';
    errorMessage = '';
    successMessage = '';
  }

  // Close confirmation dialog
  function closeConfirmDialog() {
    showConfirmDialog = false;
    actionType = null;
    reason = '';
  }

  // Execute moderation action
  async function executeAction() {
    if (!actionType) return;

    isProcessing = true;
    errorMessage = '';
    successMessage = '';

    try {
      switch (actionType) {
        case 'flag':
          if (!reportId) throw new Error('Report ID is required');
          await flagReport(reportId, reason);
          successMessage = 'Report flagged successfully';
          break;

        case 'remove':
          if (targetType === 'comment') {
            if (!reportId || !commentId) throw new Error('Report ID and Comment ID are required');
            await removeComment(reportId, commentId, reason);
            successMessage = 'Comment removed successfully';
          } else {
            throw new Error('Remove action only supports comments');
          }
          break;

        case 'suspend':
          if (!userId) throw new Error('User ID is required');
          await suspendUser(userId, reason);
          successMessage = 'User suspended successfully';
          break;
      }

      // Close dialog after successful action
      setTimeout(() => {
        closeConfirmDialog();
      }, 1500);
    } catch (error: any) {
      console.error('Moderation action failed:', error);
      errorMessage = error.message || 'Failed to execute moderation action';
    } finally {
      isProcessing = false;
    }
  }

  // Get action label
  function getActionLabel(action: 'flag' | 'remove' | 'suspend'): string {
    switch (action) {
      case 'flag': return 'Flag Report';
      case 'remove': return 'Remove Comment';
      case 'suspend': return 'Suspend User';
    }
  }

  // Get action description
  function getActionDescription(action: 'flag' | 'remove' | 'suspend'): string {
    switch (action) {
      case 'flag': return 'This will mark the report as flagged and hide it from public view.';
      case 'remove': return 'This will permanently delete the comment.';
      case 'suspend': return 'This will suspend the user and prevent them from creating new content.';
    }
  }
</script>

{#if isModerator}
  <div class="moderation-panel">
    <div class="moderation-actions">
      {#if targetType === 'report'}
        <button
          class="action-btn flag-btn"
          on:click={() => openConfirmDialog('flag')}
          disabled={isProcessing}
          aria-label="Flag report"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          Flag Report
        </button>
      {/if}

      {#if targetType === 'comment' && commentId}
        <button
          class="action-btn remove-btn"
          on:click={() => openConfirmDialog('remove')}
          disabled={isProcessing}
          aria-label="Remove comment"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Remove Comment
        </button>
      {/if}

      {#if targetType === 'user' && userId}
        <button
          class="action-btn suspend-btn"
          on:click={() => openConfirmDialog('suspend')}
          disabled={isProcessing}
          aria-label="Suspend user"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          Suspend User
        </button>
      {/if}
    </div>
  </div>

  <!-- Confirmation Dialog -->
  {#if showConfirmDialog && actionType}
    <div class="dialog-overlay" on:click={closeConfirmDialog}>
      <div class="dialog-content" on:click|stopPropagation>
        <div class="dialog-header">
          <h3>{getActionLabel(actionType)}</h3>
          <button class="close-btn" on:click={closeConfirmDialog} aria-label="Close dialog">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="dialog-body">
          <p class="dialog-description">{getActionDescription(actionType)}</p>

          <div class="form-group">
            <label for="reason">Reason (optional)</label>
            <textarea
              id="reason"
              bind:value={reason}
              placeholder="Provide a reason for this action..."
              rows="3"
              disabled={isProcessing}
            />
          </div>

          {#if errorMessage}
            <div class="error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMessage}
            </div>
          {/if}

          {#if successMessage}
            <div class="success-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {successMessage}
            </div>
          {/if}
        </div>

        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            on:click={closeConfirmDialog}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            class="btn btn-danger"
            on:click={executeAction}
            disabled={isProcessing}
          >
            {#if isProcessing}
              Processing...
            {:else}
              Confirm
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .moderation-panel {
    margin-top: 1rem;
  }

  .moderation-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background-color: white;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover:not(:disabled) {
    background-color: #f9fafb;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .flag-btn:hover:not(:disabled) {
    background-color: #fef3c7;
    border-color: #f59e0b;
    color: #92400e;
  }

  .remove-btn:hover:not(:disabled) {
    background-color: #fee2e2;
    border-color: #ef4444;
    color: #991b1b;
  }

  .suspend-btn:hover:not(:disabled) {
    background-color: #fee2e2;
    border-color: #dc2626;
    color: #7f1d1d;
  }

  /* Dialog Styles */
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .dialog-content {
    background: white;
    border-radius: 0.75rem;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .dialog-header h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background-color: #f3f4f6;
    color: #111827;
  }

  .dialog-body {
    padding: 1.5rem;
  }

  .dialog-description {
    color: #6b7280;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #111827;
    resize: vertical;
    transition: border-color 0.2s;
  }

  .form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group textarea:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }

  .error-message,
  .success-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    margin-top: 1rem;
  }

  .error-message {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .success-message {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
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

  .btn-secondary {
    background-color: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: #f9fafb;
  }

  .btn-danger {
    background-color: #dc2626;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: #b91c1c;
  }

  @media (max-width: 640px) {
    .dialog-content {
      margin: 1rem;
    }

    .dialog-header,
    .dialog-body,
    .dialog-footer {
      padding: 1rem;
    }

    .action-btn {
      font-size: 0.8125rem;
      padding: 0.375rem 0.75rem;
    }
  }
</style>
