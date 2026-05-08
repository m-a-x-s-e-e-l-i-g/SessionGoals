<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';

  export let value = '';
  export let placeholder = 'Search';
  export let ariaLabel = 'Search';
  export let label: string | undefined = undefined;
  export let id: string | undefined = undefined;
  export let name: string | undefined = undefined;
  export let metaText: string | undefined = undefined;
  export let helperText: string | undefined = undefined;
  export let clearLabel = 'Reset';
  export let showClear = true;
  export let autocomplete: HTMLInputAttributes['autocomplete'] = 'off';
  export let preventSubmitOnEnter = false;

  const dispatch = createEventDispatcher<{ clear: void }>();

  function handleClear() {
    value = '';
    dispatch('clear');
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (preventSubmitOnEnter && event.key === 'Enter') {
      event.preventDefault();
    }
  }
</script>

<div class="search-shell" role="search" aria-label={ariaLabel}>
  {#if label}
    <label class="search-label" for={id}>{label}</label>
  {/if}

  <div class="search-input-wrap">
    <span class="search-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M11 4a7 7 0 1 0 4.42 12.43l4.57 4.57 1.41-1.41-4.57-4.57A7 7 0 0 0 11 4zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"></path>
      </svg>
    </span>

    <input
      {id}
      {name}
      type="search"
      bind:value
      class="search-input"
      {placeholder}
      {autocomplete}
      aria-label={ariaLabel}
      on:keydown={handleInputKeydown}
    />

    <div class="search-actions">
      <slot name="actions"></slot>

      {#if showClear && value}
        <button
          type="button"
          class="search-clear"
          on:click={handleClear}
          aria-label={clearLabel}
        >
          {clearLabel}
        </button>
      {/if}
    </div>
  </div>

  {#if metaText}
    <p class="search-meta text-sm text-muted">{metaText}</p>
  {/if}

  {#if helperText}
    <p class="search-help text-sm text-muted">{helperText}</p>
  {/if}

  <slot />
</div>

<style>
  .search-shell {
    display: grid;
    gap: 0.55rem;
    max-width: 760px;
    padding: 0.8rem;
    border-radius: var(--radius-lg);
    border: 1px solid color-mix(in oklch, var(--color-primary) 25%, var(--color-border));
    background:
      linear-gradient(180deg, color-mix(in oklch, var(--color-primary) 8%, var(--color-surface)) 0%, var(--color-surface) 100%);
  }

  .search-label {
    margin-inline: 0.2rem;
    margin-bottom: 0.1rem;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: color-mix(in oklch, var(--color-accent) 65%, var(--color-text));
  }

  .search-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface);
    padding: 0.25rem 0.35rem;
    transition: border-color 0.16s, box-shadow 0.16s;
  }

  .search-input-wrap:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 20%, transparent);
  }

  .search-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: color-mix(in oklch, var(--color-primary) 12%, var(--color-surface));
    color: color-mix(in oklch, var(--color-primary) 65%, var(--color-text));
    flex-shrink: 0;
  }

  .search-icon svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }

  .search-input {
    flex: 1;
    min-height: 42px;
    border: none;
    background: transparent;
    padding: 0.25rem 0.2rem;
    min-width: 0;
  }

  .search-input:focus {
    box-shadow: none;
  }

  .search-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .search-clear {
    min-height: 44px;
    border: 1px solid color-mix(in oklch, var(--color-primary) 25%, var(--color-border));
    border-radius: 999px;
    background: color-mix(in oklch, var(--color-primary) 9%, var(--color-surface));
    color: var(--color-text);
    font-weight: 600;
    font-size: 0.78rem;
    padding: 0.35rem 0.8rem;
    transition: background 0.15s, border-color 0.15s;
  }

  .search-clear:hover {
    background: color-mix(in oklch, var(--color-primary) 16%, var(--color-surface));
    border-color: color-mix(in oklch, var(--color-primary) 38%, var(--color-border));
  }

  .search-actions :global(.search-action-btn) {
    min-height: 44px;
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    font-size: 0.8rem;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .search-meta,
  .search-help {
    padding-inline: 0.2rem;
  }

  .search-help {
    margin-top: -0.15rem;
  }

  @media (max-width: 640px) {
    .search-shell {
      padding: 0.65rem;
    }

    .search-input-wrap {
      padding: 0.2rem 0.3rem;
    }

    .search-input {
      min-height: 40px;
    }
  }
</style>