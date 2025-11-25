<script lang="ts">
  import { onMount } from 'svelte';
  import { getAllUsers, promoteToModerator, demoteToUser } from '$lib/services/userManagementService';
  import { userRole, currentUser } from '$lib/stores/authStore';
  import type { User } from '$lib/types';

  // Component state
  let users: User[] = [];
  let isLoading = true;
  let errorMessage = '';
  let successMessage = '';
  let processingUserId: string | null = null;

  // Dialog state
  let showConfirmDialog = false;
  let selectedUser: User | null = null;
  let actionType: 'promote' | 'demote' | null = null;

  // Check if current user is admin
  $: isAdmin = $userRole === 'admin';

  // Load users on mount
  onMount(async () => {
    if (isAdmin) {
      await loadUsers();
    }
  });

  // Load all users from Firestore
  async function loadUsers() {
    isLoading = true;
    errorMessage = '';

    try {
      users = await getAllUsers();
    } catch (error: any) {
      console.error('Failed to load users:', error);
      errorMessage = error.message || 'Failed to load users';
    } finally {
      isLoading = false;
    }
  }

  // Open confirmation dialog
  function openConfirmDialog(user: User, action: 'promote' | 'demote') {
    selectedUser = user;
    actionType = action;
    showConfirmDialog = true;
    errorMessage = '';
    successMessage = '';
  }

  // Close confirmation dialog
  function closeConfirmDialog() {
    showConfirmDialog = false;
    selectedUser = null;
    actionType = null;
  }

  // Execute role change action
  async function executeRoleChange() {
    if (!selectedUser || !actionType) return;

    processingUserId = selectedUser.uid;
    errorMessage = '';
    successMessage = '';

    try {
      if (actionType === 'promote') {
        await promoteToModerator(selectedUser.uid);
        successMessage = `${selectedUser.displayName || selectedUser.email || 'User'} promoted to moderator`;
      } else {
        await demoteToUser(selectedUser.uid);
        successMessage = `${selectedUser.displayName || selectedUser.email || 'User'} demoted to citizen`;
      }

      // Reload users to reflect changes
      await loadUsers();

      // Close dialog after successful action
      setTimeout(() => {
        closeConfirmDialog();
        successMessage = '';
      }, 2000);
    } catch (error: any) {
      console.error('Role change failed:', error);
      errorMessage = error.message || 'Failed to change user role';
    } finally {
      processingUserId = null;
    }
  }

  // Get role badge color
  function getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'badge-admin';
      case 'moderator': return 'badge-moderator';
      default: return 'badge-citizen';
    }
  }

  // Format date
  function formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  // Check if user can be promoted
  function canPromote(user: User): boolean {
    return user.role === 'citizen' && user.uid !== $currentUser?.uid;
  }

  // Check if user can be demoted
  function canDemote(user: User): boolean {
    return user.role === 'moderator' && user.uid !== $currentUser?.uid;
  }
</script>

{#if isAdmin}
  <div class="user-management">
    <div class="header">
      <h2>User Management</h2>
      <button
        class="btn btn-secondary"
        on:click={loadUsers}
        disabled={isLoading}
        aria-label="Refresh user list"
      >
        Refresh
      </button>
    </div>

    {#if successMessage}
      <div class="success-banner">
        {successMessage}
      </div>
    {/if}

    {#if errorMessage}
      <div class="error-banner">
        {errorMessage}
      </div>
    {/if}

    {#if isLoading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading users...</p>
      </div>
    {:else if users.length === 0}
      <div class="empty-state">
        <p>No users found</p>
      </div>
    {:else}
      <div class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each users as user (user.uid)}
              <tr class:current-user={user.uid === $currentUser?.uid}>
                <td>
                  <div class="user-info">
                    <div class="user-avatar">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div class="user-details">
                      <div class="user-name">
                        {user.displayName || 'Anonymous'}
                        {#if user.uid === $currentUser?.uid}
                          <span class="you-badge">You</span>
                        {/if}
                      </div>
                      <div class="user-id">ID: {user.uid.substring(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="contact-info">
                    {#if user.email}
                      <div class="contact-item">{user.email}</div>
                    {/if}
                    {#if user.phoneNumber}
                      <div class="contact-item">{user.phoneNumber}</div>
                    {/if}
                    {#if !user.email && !user.phoneNumber}
                      <span class="text-muted">N/A</span>
                    {/if}
                  </div>
                </td>
                <td>
                  <span class="role-badge {getRoleBadgeClass(user.role)}">
                    {user.role}
                  </span>
                </td>
                <td>
                  {#if user.suspended}
                    <span class="status-badge status-suspended">Suspended</span>
                  {:else}
                    <span class="status-badge status-active">Active</span>
                  {/if}
                </td>
                <td class="text-muted">
                  {formatDate(user.createdAt)}
                </td>
                <td>
                  <div class="action-buttons">
                    {#if canPromote(user)}
                      <button
                        class="btn-action btn-promote"
                        on:click={() => openConfirmDialog(user, 'promote')}
                        disabled={processingUserId === user.uid}
                        aria-label="Promote to moderator"
                      >
                        Promote
                      </button>
                    {/if}
                    
                    {#if canDemote(user)}
                      <button
                        class="btn-action btn-demote"
                        on:click={() => openConfirmDialog(user, 'demote')}
                        disabled={processingUserId === user.uid}
                        aria-label="Demote to citizen"
                      >
                        Demote
                      </button>
                    {/if}

                    {#if user.role === 'admin' || user.uid === $currentUser?.uid}
                      <span class="text-muted">—</span>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Confirmation Dialog -->
  {#if showConfirmDialog && selectedUser && actionType}
    <div class="dialog-overlay" on:click={closeConfirmDialog}>
      <div class="dialog-content" on:click|stopPropagation>
        <div class="dialog-header">
          <h3>
            {actionType === 'promote' ? 'Promote to Moderator' : 'Demote to Citizen'}
          </h3>
          <button class="close-btn" on:click={closeConfirmDialog} aria-label="Close dialog">
            ×
          </button>
        </div>

        <div class="dialog-body">
          <p class="dialog-description">
            {#if actionType === 'promote'}
              Are you sure you want to promote <strong>{selectedUser.displayName || selectedUser.email || 'this user'}</strong> to moderator? 
              They will gain access to moderation features.
            {:else}
              Are you sure you want to demote <strong>{selectedUser.displayName || selectedUser.email || 'this user'}</strong> to citizen? 
              They will lose all moderator privileges.
            {/if}
          </p>

          {#if errorMessage}
            <div class="error-message">
              {errorMessage}
            </div>
          {/if}

          {#if successMessage}
            <div class="success-message">
              {successMessage}
            </div>
          {/if}
        </div>

        <div class="dialog-footer">
          <button
            class="btn btn-secondary"
            on:click={closeConfirmDialog}
            disabled={processingUserId !== null}
          >
            Cancel
          </button>
          <button
            class="btn {actionType === 'promote' ? 'btn-primary' : 'btn-warning'}"
            on:click={executeRoleChange}
            disabled={processingUserId !== null}
          >
            {#if processingUserId !== null}
              Processing...
            {:else}
              Confirm
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <div class="access-denied">
    <h3>Access Denied</h3>
    <p>You must be an administrator to access this page.</p>
  </div>
{/if}


<style>
  .user-management {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .header h2 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .btn {
    display: flex;
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

  .btn-secondary {
    background-color: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: #f9fafb;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .btn-warning {
    background-color: #f59e0b;
    color: white;
  }

  .btn-warning:hover:not(:disabled) {
    background-color: #d97706;
  }

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

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
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

  .users-table-container {
    background: white;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }

  .users-table {
    width: 100%;
    border-collapse: collapse;
  }

  .users-table thead {
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .users-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
  }

  .users-table td {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.875rem;
    color: #111827;
  }

  .users-table tbody tr:hover {
    background-color: #f9fafb;
  }

  .users-table tbody tr.current-user {
    background-color: #eff6ff;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .user-name {
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .user-id {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .you-badge {
    padding: 0.125rem 0.5rem;
    background-color: #3b82f6;
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    border-radius: 9999px;
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

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .status-active {
    background-color: #d1fae5;
    color: #065f46;
  }

  .status-suspended {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .btn-action {
    padding: 0.375rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    background-color: white;
    color: #6b7280;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-promote:hover:not(:disabled) {
    background-color: #dbeafe;
    border-color: #3b82f6;
    color: #1e40af;
  }

  .btn-demote:hover:not(:disabled) {
    background-color: #fef3c7;
    border-color: #f59e0b;
    color: #92400e;
  }

  .text-muted {
    color: #9ca3af;
  }

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
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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
    font-size: 1.5rem;
    padding: 0.25rem;
    border-radius: 0.25rem;
  }

  .close-btn:hover {
    background-color: #f3f4f6;
  }

  .dialog-body {
    padding: 1.5rem;
  }

  .dialog-description {
    color: #6b7280;
    line-height: 1.6;
  }

  .error-message,
  .success-message {
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

  .access-denied {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    color: #6b7280;
  }

  .access-denied h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  @media (max-width: 1024px) {
    .users-table-container {
      overflow-x: auto;
    }

    .users-table {
      min-width: 800px;
    }
  }

  @media (max-width: 640px) {
    .user-management {
      padding: 1rem;
    }

    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
  }
</style>
