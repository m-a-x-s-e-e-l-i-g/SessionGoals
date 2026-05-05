<script lang="ts">
  import type { Spot } from '$lib/types';
  import TagBadge from './TagBadge.svelte';

  export let spot: Spot;
</script>

<div class="spot-card card">
  <div class="spot-header">
    <span class="spot-icon">📍</span>
    <h3 class="spot-name">{spot.name}</h3>
  </div>

  {#if spot.city || spot.country}
    <p class="text-muted text-sm">
      {[spot.city, spot.country].filter(Boolean).join(', ')}
    </p>
  {/if}

  {#if spot.description}
    <p class="text-sm text-muted spot-desc">{spot.description}</p>
  {/if}

  {#if spot.tags.length > 0}
    <div class="flex flex-wrap gap-1 mt-1">
      {#each spot.tags as tag}
        <TagBadge {tag} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .spot-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .spot-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .spot-icon { font-size: 1.1rem; }

  .spot-name {
    font-size: 1rem;
    font-weight: 600;
  }

  .spot-desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
