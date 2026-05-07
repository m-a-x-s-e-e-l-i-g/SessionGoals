<script lang="ts">
  import { compressImageFileToDataUrl } from '$lib/utils/imageUpload';

  export let id = 'imageUpload';
  export let name = 'imageUrl';
  export let label = 'Image';
  export let value = '';
  export let helperText = 'Image is compressed locally before saving.';

  let isProcessing = false;
  let uploadError: string | undefined;
  let fileInput: HTMLInputElement | null = null;

  async function handleFileSelected(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploadError = undefined;
    isProcessing = true;

    try {
      const compressed = await compressImageFileToDataUrl(file);
      value = compressed.dataUrl;
    } catch (error: any) {
      uploadError = error?.message ?? 'Failed to process image.';
    } finally {
      isProcessing = false;
    }
  }

  function clearImage() {
    value = '';
    uploadError = undefined;
    if (fileInput) {
      fileInput.value = '';
    }
  }
</script>

<div class="form-group">
  <label for={id}>{label}</label>
  <input type="hidden" {name} value={value} />
  <input
    bind:this={fileInput}
    id={id}
    type="file"
    accept="image/png,image/jpeg,image/webp,image/avif"
    on:change={handleFileSelected}
    disabled={isProcessing}
  />

  {#if isProcessing}
    <p class="text-sm text-muted upload-status">Compressing image...</p>
  {/if}

  {#if helperText}
    <p class="text-sm text-muted upload-status">{helperText}</p>
  {/if}

  {#if uploadError}
    <p class="form-error">{uploadError}</p>
  {/if}

  {#if value}
    <div class="image-preview-wrap">
      <img src={value} alt="Selected goal preview" class="image-preview" loading="lazy" />
      <button type="button" class="btn btn-ghost btn-sm" on:click={clearImage}>Remove image</button>
    </div>
  {/if}
</div>

<style>
  .upload-status {
    margin-top: 0.4rem;
  }

  .image-preview-wrap {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    align-items: flex-start;
  }

  .image-preview {
    width: min(100%, 280px);
    max-height: 220px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-surface-2);
  }

  .form-error {
    color: var(--color-danger);
    font-size: 0.85rem;
    padding: 0.5rem;
    background: rgba(242, 78, 78, 0.1);
    border-radius: var(--radius-sm);
    margin-top: 0.5rem;
  }
</style>
