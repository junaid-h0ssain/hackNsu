<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { createReport } from '$lib/services/reportService';
  import LocationPicker from '$lib/components/map/LocationPicker.svelte';
  import type { Location, CreateReportInput } from '$lib/types';

  const dispatch = createEventDispatcher<{ success: string; error: string }>();

  // Form state
  let title = '';
  let description = '';
  let crimeType = '';
  let location: Location | null = null;
  let mediaFiles: File[] = [];
  let mediaPreviewUrls: string[] = [];
  
  // UI state
  let isSubmitting = false;
  let showLocationPicker = false;
  let errors: Record<string, string> = {};

  // Crime type options
  const crimeTypes = [
    { value: 'theft', label: 'Theft' },
    { value: 'assault', label: 'Assault' },
    { value: 'vandalism', label: 'Vandalism' },
    { value: 'burglary', label: 'Burglary' },
    { value: 'fraud', label: 'Fraud' },
    { value: 'robbery', label: 'Robbery' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'other', label: 'Other' }
  ];

  function handleLocationSelect(event: CustomEvent<Location>) {
    location = event.detail;
    errors.location = '';
  }

  function handleMediaChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    
    // Validate file count (max 5 files)
    if (files.length > 5) {
      errors.media = 'Maximum 5 files allowed';
      return;
    }

    // Validate file sizes and types
    const validFiles: File[] = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.media = `Invalid file type: ${file.name}. Only images and videos allowed.`;
        return;
      }
      if (file.size > maxSize) {
        errors.media = `File too large: ${file.name}. Maximum size is 10MB.`;
        return;
      }
      validFiles.push(file);
    }

    mediaFiles = validFiles;
    errors.media = '';

    // Create preview URLs
    mediaPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
  }

  function removeMedia(index: number) {
    // Revoke the preview URL
    URL.revokeObjectURL(mediaPreviewUrls[index]);
    
    // Remove from arrays
    mediaFiles = mediaFiles.filter((_, i) => i !== index);
    mediaPreviewUrls = mediaPreviewUrls.filter((_, i) => i !== index);
  }

  function validateForm(): boolean {
    errors = {};
    let isValid = true;

    if (!title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    } else if (title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
      isValid = false;
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    } else if (description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
      isValid = false;
    }

    if (!crimeType) {
      errors.crimeType = 'Crime type is required';
      isValid = false;
    }

    if (!location) {
      errors.location = 'Location is required';
      isValid = false;
    }

    return isValid;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    isSubmitting = true;

    try {
      const reportInput: CreateReportInput = {
        title: title.trim(),
        description: description.trim(),
        crimeType,
        location: location!,
        mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined
      };

      const reportId = await createReport(reportInput);
      
      // Clean up preview URLs
      mediaPreviewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Reset form
      title = '';
      description = '';
      crimeType = '';
      location = null;
      mediaFiles = [];
      mediaPreviewUrls = [];
      showLocationPicker = false;

      dispatch('success', reportId);
    } catch (error: any) {
      console.error('Failed to create report:', error);
      dispatch('error', error.message || 'Failed to create report');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="report-form">
  <h2 class="text-2xl font-bold mb-6">Submit Crime Report</h2>

  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <!-- Title -->
    <div class="form-group">
      <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
        Title <span class="text-red-500">*</span>
      </label>
      <input
        id="title"
        type="text"
        bind:value={title}
        placeholder="Brief title of the incident"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isSubmitting}
      />
      {#if errors.title}
        <p class="text-red-500 text-sm mt-1">{errors.title}</p>
      {/if}
    </div>

    <!-- Crime Type -->
    <div class="form-group">
      <label for="crimeType" class="block text-sm font-medium text-gray-700 mb-2">
        Crime Type <span class="text-red-500">*</span>
      </label>
      <select
        id="crimeType"
        bind:value={crimeType}
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isSubmitting}
      >
        <option value="">Select a crime type</option>
        {#each crimeTypes as type}
          <option value={type.value}>{type.label}</option>
        {/each}
      </select>
      {#if errors.crimeType}
        <p class="text-red-500 text-sm mt-1">{errors.crimeType}</p>
      {/if}
    </div>

    <!-- Description -->
    <div class="form-group">
      <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
        Description <span class="text-red-500">*</span>
      </label>
      <textarea
        id="description"
        bind:value={description}
        placeholder="Provide detailed information about the incident..."
        rows="6"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
        disabled={isSubmitting}
      />
      {#if errors.description}
        <p class="text-red-500 text-sm mt-1">{errors.description}</p>
      {/if}
      <p class="text-gray-500 text-sm mt-1">
        {description.length} characters (minimum 20)
      </p>
    </div>

    <!-- Location -->
    <div class="form-group">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Location <span class="text-red-500">*</span>
      </label>
      
      {#if !showLocationPicker}
        <button
          type="button"
          on:click={() => showLocationPicker = true}
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          disabled={isSubmitting}
        >
          {location ? 'Change Location' : 'Select Location on Map'}
        </button>
        
        {#if location}
          <p class="text-sm text-gray-600 mt-2">
            Selected: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        {/if}
      {:else}
        <div class="location-picker-container">
          <LocationPicker 
            initialLocation={location}
            on:select={handleLocationSelect}
          />
          <button
            type="button"
            on:click={() => showLocationPicker = false}
            class="mt-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            Close Map
          </button>
        </div>
      {/if}
      
      {#if errors.location}
        <p class="text-red-500 text-sm mt-1">{errors.location}</p>
      {/if}
    </div>

    <!-- Media Upload -->
    <div class="form-group">
      <label for="media" class="block text-sm font-medium text-gray-700 mb-2">
        Photos/Videos (Optional)
      </label>
      <input
        id="media"
        type="file"
        accept="image/*,video/*"
        multiple
        on:change={handleMediaChange}
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isSubmitting}
      />
      {#if errors.media}
        <p class="text-red-500 text-sm mt-1">{errors.media}</p>
      {/if}
      <p class="text-gray-500 text-sm mt-1">
        Maximum 5 files, 10MB each. Supported: JPEG, PNG, GIF, WebP, MP4, WebM
      </p>

      <!-- Media Previews -->
      {#if mediaPreviewUrls.length > 0}
        <div class="media-previews mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          {#each mediaPreviewUrls as previewUrl, index}
            <div class="media-preview-item relative">
              {#if mediaFiles[index].type.startsWith('image/')}
                <img src={previewUrl} alt="Preview {index + 1}" class="w-full h-32 object-cover rounded-lg" />
              {:else}
                <video src={previewUrl} class="w-full h-32 object-cover rounded-lg" controls />
              {/if}
              <button
                type="button"
                on:click={() => removeMedia(index)}
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                disabled={isSubmitting}
                aria-label="Remove media"
              >
                ×
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Submit Button -->
    <div class="form-actions">
      <button
        type="submit"
        disabled={isSubmitting}
        class="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {#if isSubmitting}
          <span class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting Report...
          </span>
        {:else}
          Submit Report
        {/if}
      </button>
    </div>
  </form>
</div>

<style>
  .report-form {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .location-picker-container {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    background-color: #f9fafb;
  }

  .media-preview-item {
    position: relative;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .report-form {
      padding: 1rem;
    }
  }
</style>
