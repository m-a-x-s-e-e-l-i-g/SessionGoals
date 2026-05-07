<script lang="ts">
  import type { Spot } from '$lib/types';
  import TagBadge from './TagBadge.svelte';

  export let spot: Spot;
  export let showActions = false;

  let hideImage = false;

  $: if (spot?.id) {
    hideImage = false;
  }

  const googleMapsLogoUrl =
    '/images/icons/google-map-icon.svg';

  function getProxiedImageUrl(imageUrl: string | undefined): string | undefined {
    if (!imageUrl) return undefined;
    if (imageUrl.startsWith('/api/image-proxy')) return imageUrl;

    const normalized = imageUrl.startsWith('/') ? `https://parkour.spot${imageUrl}` : imageUrl;
    return `/api/image-proxy?url=${encodeURIComponent(normalized)}`;
  }

  function getGoogleMapsUrl(): string | null {
    const lat = spot.coordinates?.lat;
    const lng = spot.coordinates?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    if (lat === 0 && lng === 0) return null;

    const latLng = `${lat},${lng}`;
    const url = new URL('https://www.google.com/maps/search/');
    url.searchParams.set('api', '1');
    url.searchParams.set('query', latLng);
    url.searchParams.set('center', latLng);
    return url.toString();
  }

  $: googleMapsUrl = getGoogleMapsUrl();
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

  {#if spot.coordinates || spot.externalId}
    <div class="spot-ext-links">
      {#if googleMapsUrl}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="spot-ext-link"
          title="Open in Google Maps"
        >
          <img src={googleMapsLogoUrl} alt="" class="ext-logo" width="14" height="14" aria-hidden="true" />
          Google Maps
        </a>
      {/if}
      {#if spot.externalId}
        <a
          href="https://parkour.spot/spot/{spot.externalId}"
          target="_blank"
          rel="noopener noreferrer"
          class="spot-ext-link"
          title="View on parkour.spot"
        >
          <img src="https://parkour.spot/favicon.ico" alt="" class="ext-logo ext-logo--parkour" width="14" height="14" aria-hidden="true" />
          parkour.spot
        </a>
      {/if}
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

  .spot-ext-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.15rem;
  }

  .spot-ext-link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.78rem;
    font-weight: 500;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: border-color 0.12s, color 0.12s;
    white-space: nowrap;
  }

  .spot-ext-link:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    text-decoration: none;
  }

  .ext-logo {
    border-radius: 3px;
    flex-shrink: 0;
  }

  @media (prefers-color-scheme: dark) {
    .ext-logo--parkour {
      filter: invert(1) brightness(0.85);
    }
  }
</style>
