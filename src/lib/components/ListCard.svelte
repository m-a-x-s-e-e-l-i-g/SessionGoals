<script lang="ts">
  import type { GoalList } from '$lib/types';
  import { formatListType, formatListVisibility } from '$lib/utils/format';
  import { getUserDisplayName } from '$lib/data/session';

  export let list: GoalList;
  export let showOwner = false;
  export let isTracked = false;
  export let progress: { done: number; total: number } | undefined = undefined;
</script>

<a href="/lists/{list.id}" class="list-card card">
  <div class="list-header">
    <div class="list-labels">
      <span class="badge list-type-badge">{formatListType(list.type)}</span>
      <span class="badge list-visibility-badge visibility-{list.visibility}">
        {formatListVisibility(list.visibility)}
      </span>
      {#if isTracked}
        <span class="badge tracking-badge">Tracking</span>
      {/if}
    </div>
    <span class="text-muted text-sm">{list.items.length} goal{list.items.length !== 1 ? 's' : ''}</span>
  </div>
  <h3 class="list-name">{list.name}</h3>
  {#if list.description}
    <p class="text-muted text-sm">{list.description}</p>
  {/if}
  {#if showOwner}
    <p class="text-muted text-sm">By {getUserDisplayName(list.userId)}</p>
  {/if}
  {#if progress && progress.total > 0}
    <div class="list-progress" aria-label={`Progress ${progress.done} of ${progress.total}`}>
      <div class="list-progress-bar" style={`width: ${(progress.done / progress.total) * 100}%`}></div>
    </div>
  {/if}
</a>

<style>
  .list-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--color-text);
    transition: border-color 0.15s;
  }

  .list-card:hover {
    border-color: var(--color-primary);
    text-decoration: none;
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .list-labels {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .list-name {
    font-size: 1rem;
    font-weight: 600;
  }

  .list-type-badge {
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    font-size: 0.72rem;
  }

  .list-visibility-badge {
    font-size: 0.72rem;
    border: 1px solid var(--color-border);
  }

  .visibility-public {
    background: color-mix(in oklch, var(--color-primary) 18%, white);
    color: color-mix(in oklch, var(--color-primary) 65%, black);
    border-color: color-mix(in oklch, var(--color-primary) 45%, var(--color-border));
  }

  .visibility-private {
    background: var(--color-surface-2);
    color: var(--color-text-muted);
  }

  .tracking-badge {
    background: color-mix(in oklch, var(--color-primary) 12%, white);
    color: color-mix(in oklch, var(--color-primary) 72%, black);
    border: 1px solid color-mix(in oklch, var(--color-primary) 40%, var(--color-border));
    font-size: 0.72rem;
  }

  .list-progress {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--color-surface-2);
    overflow: hidden;
    margin-top: 0.3rem;
  }

  .list-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--color-success), var(--color-primary));
  }
</style>
