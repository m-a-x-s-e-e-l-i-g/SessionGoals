<script lang="ts">
  import type { Goal } from '$lib/types';
  import { formatStatus, formatGoalType, statusColor, typeIcon } from '$lib/utils/format';
  import { getGoalVisualImageUrl, proxyLibraryImageUrl } from '$lib/utils/media';

  export let goal: Goal;
  export let onToggle: ((id: string) => void) | undefined = undefined;
  export let onAddToMine: ((goal: Goal) => void) | undefined = undefined;
  export let onCommitToLibrary: ((goal: Goal) => void) | undefined = undefined;
  export let addToMineLabel = 'Add to my goals';
  export let spotName: string | undefined = undefined;
  export let statusNote: string | undefined = undefined;
  export let insightNote: string | undefined = undefined;

  $: goalVisualImageUrl = proxyLibraryImageUrl(getGoalVisualImageUrl(goal));
</script>

<div class="goal-card card">
  <a
    href="/goals/{goal.id}"
    class="goal-card-overlay-link"
    aria-label="Open goal: {goal.title}"
  ></a>

  {#if goalVisualImageUrl}
    <a
      href="/goals/{goal.id}"
      class="move-preview-wrap"
      aria-label="Open goal: {goal.title}"
      tabindex="-1"
    >
      <img
        class="move-preview"
        src={goalVisualImageUrl}
        alt="{goal.title} preview"
        loading="lazy"
        on:error={(e) => {
          (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none';
        }}
      />
    </a>
  {/if}

  <div class="goal-card-header">
    <span class="type-badge badge type-{goal.type}">
      {typeIcon(goal.type)} {formatGoalType(goal.type)}
    </span>
    <div class="goal-card-header-actions">
      {#if goal.status === 'done'}
        <span class="badge {statusColor(goal.status)}">✓ {formatStatus(goal.status)}</span>
      {/if}
      {#if onCommitToLibrary}
        <button
          type="button"
          class="commit-library-btn"
          on:click|stopPropagation={() => onCommitToLibrary?.(goal)}
          title="Commit to Movement Library"
        >
          📌 Commit
        </button>
      {/if}
      {#if onAddToMine}
        <button
          type="button"
          class="add-goal"
          on:click|stopPropagation={() => onAddToMine?.(goal)}
        >
          + {addToMineLabel}
        </button>
      {/if}
    </div>
  </div>

  <div class="goal-card-link">
    <h3 class="goal-title">{goal.title}</h3>

    {#if goal.description}
      <p class="goal-desc text-muted text-sm">{goal.description}</p>
    {/if}

    {#if spotName}
      <p class="goal-spot text-sm text-muted">📍 {spotName}</p>
    {/if}

    {#if statusNote}
      <p class="goal-status-note text-sm">{statusNote}</p>
    {/if}

    {#if insightNote}
      <p class="goal-insight-note text-sm text-muted">{insightNote}</p>
    {/if}

    {#if goal.difficulty}
      <div class="goal-difficulty mt-1" title="Difficulty: {goal.difficulty} out of 5" aria-label="Difficulty {goal.difficulty} out of 5">
        {#each Array(5) as _, i}
          <span class="dot" class:filled={i < (goal.difficulty ?? 0)}>●</span>
        {/each}
      </div>
    {/if}
  </div>

  {#if onToggle}
    <div class="goal-card-footer">
      <button
        type="button"
        class="toggle-btn"
        class:is-done={goal.status === 'done'}
        on:click|stopPropagation={() => onToggle?.(goal.id)}
        aria-label={goal.status === 'done' ? 'Mark goal as unchecked' : 'Mark goal as checked'}
        aria-pressed={goal.status === 'done'}
      >
        {goal.status === 'done' ? 'Uncheck' : 'Mark as done'}
      </button>
    </div>
  {/if}
</div>

<style>
  .goal-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    color: var(--color-text);
    transition: border-color 0.18s, transform 0.18s;
  }

  /* Flush image: bleeds to card edges, fixed 3:2 aspect ratio */
  .move-preview-wrap {
    margin: calc(-1 * var(--space-lg)) calc(-1 * var(--space-md)) 0;
    aspect-ratio: 3 / 2;
    border-radius: calc(var(--radius-md) - 1px) calc(var(--radius-md) - 1px) 0 0;
    overflow: hidden;
    background: var(--color-surface-2);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .move-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .goal-card-overlay-link {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    z-index: 0;
  }

  .goal-card-overlay-link:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .goal-card:hover,
  .goal-card:focus-within {
    border-color: var(--color-primary);
    transform: translateY(-3px);
  }

  .goal-card-header {
    position: relative;
    z-index: 1;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .goal-card-header-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .goal-card-link {
    position: relative;
    z-index: 1;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    color: inherit;
    text-decoration: none;
  }

  .goal-card-link:hover {
    text-decoration: none;
  }

  .goal-title {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .goal-desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .goal-difficulty {
    display: flex;
    gap: 3px;
    font-size: 0.8rem;
  }

  .goal-status-note {
    color: var(--color-success);
    font-weight: 600;
  }

  .goal-insight-note {
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .goal-card-footer {
    position: relative;
    z-index: 1;
    pointer-events: auto;
    border-top: 1px solid var(--color-border);
    margin-top: var(--space-xs);
    padding-top: var(--space-sm);
    display: flex;
    gap: var(--space-sm);
  }

  .toggle-btn {
    pointer-events: auto;
    flex: 1;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    padding: 0.4rem var(--space-sm);
    font-size: 0.78rem;
    font-weight: 600;
    font-family: inherit;
    line-height: 1;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }

  .toggle-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .toggle-btn.is-done {
    border-color: color-mix(in oklch, var(--color-success) 42%, var(--color-border));
    color: var(--color-success);
    background: color-mix(in oklch, var(--color-success) 10%, var(--color-surface));
  }

  .toggle-btn.is-done:hover {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: color-mix(in oklch, var(--color-danger) 8%, var(--color-surface));
  }

  .add-goal {
    pointer-events: auto;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    border-radius: 999px;
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: inherit;
    line-height: 1;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .add-goal:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .commit-library-btn {
    pointer-events: auto;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    border-radius: 999px;
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: inherit;
    line-height: 1;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .commit-library-btn:hover {
    border-color: var(--color-warning, #f59e0b);
    color: var(--color-warning, #f59e0b);
  }

  .dot { color: var(--color-border); }
  .dot.filled { color: var(--color-primary); }
</style>
