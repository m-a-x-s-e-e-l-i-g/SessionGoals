<script lang="ts">
  import type { GoalList } from '$lib/types';
  import { formatListType } from '$lib/utils/format';

  export let list: GoalList;
</script>

<a href="/lists/{list.id}" class="list-card card">
  <div class="list-header">
    <span class="badge list-type-badge">{formatListType(list.type)}</span>
    <span class="text-muted text-sm">{list.items.length} goal{list.items.length !== 1 ? 's' : ''}</span>
  </div>
  <h3 class="list-name">{list.name}</h3>
  {#if list.description}
    <p class="text-muted text-sm">{list.description}</p>
  {/if}
</a>

<style>
  .list-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--color-text);
    transition: border-color 0.15s, transform 0.15s;
  }

  .list-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    text-decoration: none;
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
</style>
