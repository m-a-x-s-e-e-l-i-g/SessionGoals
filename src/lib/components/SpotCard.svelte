<script lang="ts">
  import type { Spot } from '$lib/types';
  import TagBadge from './TagBadge.svelte';

  export let spot: Spot;
  export let showActions = false;

  let hideImage = false;

  $: if (spot?.id) {
    hideImage = false;
  }

  function getProxiedImageUrl(imageUrl: string | undefined): string | undefined {
    if (!imageUrl) return undefined;
    if (imageUrl.startsWith('/api/image-proxy')) return imageUrl;

    const normalized = imageUrl.startsWith('/') ? `https://parkour.spot${imageUrl}` : imageUrl;
    return `/api/image-proxy?url=${encodeURIComponent(normalized)}`;
  }
</script>

<div class="spot-card card">
  {#if spot.imageUrl && !hideImage}
    <img
      src={getProxiedImageUrl(spot.imageUrl)}
      alt={spot.name}
      class="spot-image"
      loading="lazy"
      on:error={() => (hideImage = true)}
    />
  {/if}

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

  {#if showActions}
    <slot name="actions" />
  {/if}
</div>

<style>
  .spot-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .spot-image {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-surface-2);
    margin-bottom: 0.2rem;
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
    line-clamp: 2;
    overflow: hidden;
  }
</style>
