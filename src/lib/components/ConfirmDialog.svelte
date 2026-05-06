<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;
  export let title = 'Confirm';
  export let message = 'Are you sure?';
  export let confirmLabel = 'Delete';
  export let cancelLabel = 'Cancel';
  export let isDangerous = false;
  export let isLoading = false;

  const dispatch = createEventDispatcher<{ confirm: void; cancel: void }>();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget && !isLoading) {
      isOpen = false;
      dispatch('cancel');
    }
  }

  function handleConfirm() {
    if (!isLoading) {
      dispatch('confirm');
    }
  }

  function handleCancel() {
    if (!isLoading) {
      isOpen = false;
      dispatch('cancel');
    }
  }
</script>

{#if isOpen}
  <div class="confirm-dialog-backdrop" on:click={handleBackdropClick} on:keydown={(e) => e.key === 'Escape' && !isLoading && (isOpen = false)} role="presentation">
    <div class="confirm-dialog">
      <div class="confirm-dialog-header">
        <h2 class="confirm-dialog-title">{title}</h2>
      </div>

      <div class="confirm-dialog-body">
        <p class="confirm-dialog-message">{message}</p>
      </div>

      <div class="confirm-dialog-actions">
        <button
          class="btn btn-ghost"
          on:click={handleCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </button>
        <button
          class="btn"
          class:btn-danger={isDangerous}
          class:btn-primary={!isDangerous}
          on:click={handleConfirm}
          disabled={isLoading}
        >
          {#if isLoading}
            <span class="spinner"></span>
          {/if}
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confirm-dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .confirm-dialog {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 400px;
    width: 90%;
    animation: slideUp 0.2s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .confirm-dialog-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .confirm-dialog-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-text);
  }

  .confirm-dialog-body {
    padding: 1.5rem;
  }

  .confirm-dialog-message {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  .confirm-dialog-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
  }

  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    margin-right: 0.5rem;
    vertical-align: -2px;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  :global(.btn) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  :global(.btn:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
