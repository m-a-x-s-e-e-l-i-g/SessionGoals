<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import 'leaflet/dist/leaflet.css';
  import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
  import markerIconUrl from 'leaflet/dist/images/marker-icon.png?url';
  import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png?url';
  import type { Spot } from '$lib/types';
  import SpotCard from '$lib/components/SpotCard.svelte';
  import SpotActions from '$lib/components/SpotActions.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import { getLists, getListById } from '$lib/data/lists';
  import { getGoals, getMyGoals } from '$lib/data/goals';
  import { getSpots } from '$lib/data/spots';
  import { getTrackedProgress } from '$lib/data/listProgress';
  import type { Goal } from '$lib/types';

  export let data: {
    spots: Spot[];
    error: 'missing_api_key' | 'api_error' | null;
    query: string;
  };

  $: isAuthenticated = !!$page.data.user;
  $: spots = data.spots;
  $: query = $page.url.searchParams.get('q') ?? '';
  const lists = getLists();
  const allGoals = getGoals();
  const allKnownSpots = getSpots();

  function toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  function getNormalizedCoordinates(spot: Spot): { lat: number; lng: number } | null {
    const lat = toFiniteNumber(spot.coordinates?.lat);
    const lng = toFiniteNumber(spot.coordinates?.lng);
    if (lat === null || lng === null) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    if (lat === 0 && lng === 0) return null;
    return { lat, lng };
  }

  function hasUsableCoordinates(spot: Spot): boolean {
    return getNormalizedCoordinates(spot) !== null;
  }

  function hasUsableImageUrl(spot: Spot): boolean {
    return typeof spot.imageUrl === 'string' && spot.imageUrl.trim().length > 0;
  }

  function escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  const goalById = new Map(allGoals.map((goal) => [goal.id, goal]));
  const myGoals = getMyGoals();
  const trackedProgress = getTrackedProgress();
  const trackedGoals: Goal[] = trackedProgress.flatMap((progress) => {
    const list = getListById(progress.sourceListId);
    if (!list) return [];
    return list.items
      .map((item) => goalById.get(item.goalId) ?? item.goal)
      .filter((goal): goal is Goal => !!goal);
  });

  const actionGoals = [...myGoals, ...trackedGoals].filter((goal) => !!goal.spotId);
  const actionSpotCounts = new Map<string, number>();
  for (const goal of actionGoals) {
    const spotId = goal.spotId;
    if (!spotId) continue;
    actionSpotCounts.set(spotId, (actionSpotCounts.get(spotId) ?? 0) + 1);
  }

  const spotById = new Map(allKnownSpots.map((spot) => [spot.id, spot]));
  let hydratedSpotByExternalId = new Map<string, Spot>();
  let hydratedSpotBySavedId = new Map<string, Spot>();
  let hydrationInFlightKeys = new Set<string>();
  let isHydratingActionSpots = false;

  function deriveExternalIdFromSpotId(spotId: string): string | null {
    if (!spotId.startsWith('ps-')) return null;
    const derived = spotId.slice(3).trim();
    return derived ? derived : null;
  }

  function normalizeForCompare(value: string | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }

  $: queryLiveSpotByExternalId = new Map(
    spots
      .filter((spot) => !!spot.externalId)
      .map((spot) => [spot.externalId as string, spot])
  );
  $: liveSpotByExternalId = new Map([
    ...hydratedSpotByExternalId.entries(),
    ...queryLiveSpotByExternalId.entries(),
  ]);

  $: savedActionSpots = Array.from(actionSpotCounts.keys())
    .map((spotId) => {
      const savedSpot = spotById.get(spotId);
      if (!savedSpot) return null;

      return savedSpot;
    })
    .filter((spot): spot is Spot => !!spot);

  $: actionSpots = savedActionSpots
    .map((savedSpot) => {
      const derivedExternalId = deriveExternalIdFromSpotId(savedSpot.id);
      const liveSpot =
        hydratedSpotBySavedId.get(savedSpot.id) ??
        (savedSpot.externalId ? liveSpotByExternalId.get(savedSpot.externalId) : undefined) ??
        (derivedExternalId ? liveSpotByExternalId.get(derivedExternalId) : undefined);
      if (!liveSpot) return savedSpot;

      return {
        ...savedSpot,
        // Coordinates and image are API-owned fields.
        coordinates: liveSpot.coordinates,
        city: savedSpot.city ?? liveSpot.city,
        country: savedSpot.country ?? liveSpot.country,
        description: savedSpot.description ?? liveSpot.description,
        imageUrl: liveSpot.imageUrl,
      } satisfies Spot;
    })
    .filter((spot): spot is Spot => !!spot);

  async function hydrateActionSpotsFromApi() {
    if (!browser || !isAuthenticated) return;

    const findBestApiSpot = (savedSpot: Spot, candidates: Spot[]): Spot | null => {
      if (candidates.length === 0) return null;

      const possibleExternalIds = [savedSpot.externalId, deriveExternalIdFromSpotId(savedSpot.id)]
        .filter((value): value is string => !!value && value.trim().length > 0)
        .map((value) => value.trim());

      for (const externalId of possibleExternalIds) {
        const exactByExternalId = candidates.find((candidate) => candidate.externalId === externalId);
        if (exactByExternalId) return exactByExternalId;
      }

      const savedName = normalizeForCompare(savedSpot.name);
      const savedCity = normalizeForCompare(savedSpot.city);

      const sameName = candidates.filter((candidate) => normalizeForCompare(candidate.name) === savedName);
      if (sameName.length === 1) return sameName[0];

      if (sameName.length > 1 && savedCity) {
        const sameCity = sameName.find((candidate) => normalizeForCompare(candidate.city) === savedCity);
        if (sameCity) return sameCity;
      }

      if (candidates.length === 1) return candidates[0];
      return sameName[0] ?? null;
    };

    const findApiSpotForSavedSpot = async (savedSpot: Spot): Promise<Spot | null> => {
      const queries = [savedSpot.externalId, deriveExternalIdFromSpotId(savedSpot.id), savedSpot.name, savedSpot.city]
        .filter((value): value is string => !!value && value.trim().length > 0);

      for (const queryValue of queries) {
        const trimmed = queryValue.trim();
        if (!trimmed) continue;

        const res = await fetch(`/api/parkour-spot/spots?q=${encodeURIComponent(trimmed)}&limit=40`);
        if (!res.ok) continue;

        const payload = await res.json().catch(() => null);
        const candidates = Array.isArray(payload?.spots) ? (payload.spots as Spot[]) : [];
        const best = findBestApiSpot(savedSpot, candidates);
        if (best) return best;
      }

      return null;
    };

    const targets = savedActionSpots.filter((savedSpot) => {
      const hydratedSpot = hydratedSpotBySavedId.get(savedSpot.id);
      const spotForHydration = hydratedSpot ?? savedSpot;
      return !hasUsableCoordinates(spotForHydration) || !hasUsableImageUrl(spotForHydration);
    });

    if (targets.length === 0) return;

    isHydratingActionSpots = true;
    try {
      await Promise.allSettled(
        targets.map(async (spot) => {
          const hydrationKey = spot.id;
          if (hydrationInFlightKeys.has(hydrationKey)) return;

          hydrationInFlightKeys.add(hydrationKey);
          try {
            const exact = await findApiSpotForSavedSpot(spot);
            if (!exact) return;

            const previous = hydratedSpotBySavedId.get(spot.id) ?? spot;
            const merged: Spot = {
              ...previous,
              ...exact,
              coordinates: exact.coordinates ?? previous.coordinates,
              imageUrl: exact.imageUrl ?? previous.imageUrl,
            };

            hydratedSpotBySavedId = new Map(hydratedSpotBySavedId).set(spot.id, merged);
            if (merged.externalId) {
              hydratedSpotByExternalId = new Map(hydratedSpotByExternalId).set(merged.externalId, merged);
            }
          } catch {
            // Ignore per-spot hydration failures; UI falls back gracefully.
          } finally {
            hydrationInFlightKeys.delete(hydrationKey);
          }
        })
      );
    } finally {
      isHydratingActionSpots = false;
    }
  }

  $: filtered = spots.filter(
    (s) =>
      !query ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.city?.toLowerCase().includes(query.toLowerCase())
  );

  type UserLocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable';

  let mapEl: HTMLDivElement | null = null;
  let map: any = null;
  let leaflet: any = null;
  let spotLayer: any = null;
  let userMarker: any = null;
  let userLocation: { lat: number; lng: number } | null = null;
  let userLocationStatus: UserLocationStatus = 'idle';
  let mapInitError: string | null = null;

  $: mappableActionSpots = actionSpots.filter((spot) => hasUsableCoordinates(spot));

  async function ensureMap() {
    if (!browser || map || !mapEl || !isAuthenticated) return;

    try {
      mapInitError = null;

      const leafletModule = await import('leaflet');
      leaflet = leafletModule.default ?? leafletModule;

      const iconDefaultPrototype = leaflet.Icon.Default.prototype as { _getIconUrl?: () => string };
      delete iconDefaultPrototype._getIconUrl;

      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2xUrl,
        iconUrl: markerIconUrl,
        shadowUrl: markerShadowUrl,
      });

      map = leaflet.map(mapEl, {
        scrollWheelZoom: false,
      });

      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        })
        .addTo(map);

      mapInitError = null;
      renderMapMarkers();
      setTimeout(() => map?.invalidateSize(), 0);
    } catch {
      mapInitError = 'Map could not be loaded right now.';
    }
  }

  function renderMapMarkers() {
    if (!map || !leaflet) return;

    if (spotLayer) {
      map.removeLayer(spotLayer);
    }

    spotLayer = leaflet.layerGroup();
    const bounds: [number, number][] = [];

    for (const spot of mappableActionSpots) {
      const coordinates = getNormalizedCoordinates(spot);
      if (!coordinates) continue;
      const { lat, lng } = coordinates;

      const marker = leaflet.marker([lat, lng]);
      const safeName = escapeHtml(spot.name);
      const safeLocation = escapeHtml([spot.city, spot.country].filter(Boolean).join(', ') || 'Unknown location');
      const openInAppHref = `/spots?q=${encodeURIComponent(spot.name)}`;
      const openInMapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}&center=${encodeURIComponent(`${lat},${lng}`)}`;
      const openExternalHref = spot.externalId ? `https://parkour.spot/spot/${encodeURIComponent(spot.externalId)}` : null;

      const popupLinks = [
        `<a href="${openInAppHref}">Open in Spots</a>`,
        `<a href="${openInMapsHref}" target="_blank" rel="noopener noreferrer">Google Maps</a>`,
        openExternalHref
          ? `<a href="${openExternalHref}" target="_blank" rel="noopener noreferrer">parkour.spot</a>`
          : null,
      ].filter(Boolean).join(' · ');

      marker.bindPopup(`
        <strong>${safeName}</strong><br/>
        ${safeLocation}<br/>
        ${popupLinks}
      `);
      marker.addTo(spotLayer);
      bounds.push([lat, lng]);
    }

    spotLayer.addTo(map);

    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }

    if (userLocation) {
      userMarker = leaflet.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        color: 'var(--color-primary)',
        weight: 3,
        fillColor: 'var(--color-primary)',
        fillOpacity: 0.3,
      });

      userMarker.bindPopup('You are here');
      userMarker.addTo(map);
      bounds.push([userLocation.lat, userLocation.lng]);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [36, 36] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else {
      map.setView([20, 0], 2);
    }
  }

  function locateMe() {
    if (!browser || !navigator.geolocation) {
      userLocationStatus = 'unavailable';
      return;
    }

    userLocationStatus = 'locating';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        userLocationStatus = 'ready';
        renderMapMarkers();
      },
      (error) => {
        userLocationStatus = error.code === 1 ? 'denied' : 'unavailable';
        renderMapMarkers();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  onMount(() => {
    if (isAuthenticated) {
      const init = async () => {
        await hydrateActionSpotsFromApi();
        await ensureMap();
        if (mappableActionSpots.length > 0) {
          locateMe();
        }
      };
      init();
    }

    return () => {
      if (map) {
        map.remove();
        map = null;
      }
    };
  });

  $: if (map) {
    renderMapMarkers();
  }

  $: if (browser && isAuthenticated && mapEl && !map) {
    ensureMap();
  }

  $: if (browser && map && userLocationStatus === 'idle' && mappableActionSpots.length > 0) {
    locateMe();
  }

  $: if (browser && isAuthenticated && savedActionSpots.length > 0) {
    hydrateActionSpotsFromApi();
  }
</script>

<svelte:head>
  <title>Spots — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <h1 class="page-title">Spots</h1>
  </div>

  {#if isAuthenticated}
    <section class="my-map-section">
      <div class="section-header">
        <h2 class="section-title">Your Map</h2>
      </div>

      <div class="card map-card">
        <div bind:this={mapEl} class="your-map" role="img" aria-label="Map showing your location and your action spots"></div>
        <div class="map-meta">
          <span class="text-sm text-muted">{mappableActionSpots.length} action spot{mappableActionSpots.length === 1 ? '' : 's'} on map</span>
          {#if userLocationStatus === 'locating'}
            <span class="text-sm text-muted">Finding your location…</span>
          {:else if userLocationStatus === 'ready'}
            <span class="text-sm text-muted">Your location is shown</span>
          {:else if userLocationStatus === 'denied'}
            <span class="text-sm text-muted">Location permission denied</span>
          {:else if userLocationStatus === 'unavailable'}
            <span class="text-sm text-muted">Location unavailable</span>
          {/if}
          <button type="button" class="btn btn-ghost map-locate-btn" on:click={locateMe}>Locate me</button>
        </div>
        {#if mapInitError && !map}
          <p class="text-muted text-sm">{mapInitError}</p>
        {:else if isHydratingActionSpots && mappableActionSpots.length === 0}
          <p class="text-muted text-sm">Syncing your action spots from parkour.spot…</p>
        {:else if mappableActionSpots.length === 0}
          <p class="text-muted text-sm">No action spots with valid coordinates yet.</p>
        {/if}
      </div>
    </section>

    <div class="section-divider" aria-hidden="true"></div>

    <section class="my-spots-section">
      <div class="section-header">
        <h2 class="section-title">Your Action Spots</h2>
      </div>
      {#if actionSpots.length === 0}
        <p class="text-muted">No spot-linked goals yet. Add a goal to a spot and it will appear here.</p>
      {:else}
        <div class="grid-cards my-spots-grid">
          {#each actionSpots as spot}
            <div class="my-spot-wrap">
              <SpotCard {spot} showActions>
                <SpotActions slot="actions" {spot} {lists} goals={allGoals} />
              </SpotCard>
              <p class="text-muted text-sm my-spot-meta">
                {actionSpotCounts.get(spot.id)} goal{actionSpotCounts.get(spot.id) === 1 ? '' : 's'} tied to this spot
              </p>
            </div>
          {/each}
        </div>
      {/if}
    </section>

  {/if}

  {#if data.error === 'missing_api_key'}
    <div class="spots-error">
      Spot search isn't set up yet — parkour.spot isn't connected.
    </div>
  {:else if data.error === 'api_error'}
    <div class="spots-error spots-error--retry">
      <span>Couldn't reach parkour.spot right now.</span>
      <a href="/spots" class="btn btn-ghost spots-retry-btn">Try again</a>
    </div>
  {/if}

  <form class="search-bar" method="GET">
    <SearchBar
      bind:value={query}
      name="q"
      placeholder="Search by name or city"
      ariaLabel="Search spots"
      showClear={false}
      metaText={query
        ? `Showing ${filtered.length} result${filtered.length === 1 ? '' : 's'}`
        : 'Search live spots from parkour.spot'}
    >
      <svelte:fragment slot="actions">
        <button class="btn btn-ghost search-action-btn" type="submit">
          <img
            src="https://parkour.spot/favicon.ico"
            alt="parkour.spot"
            class="parkour-spot-logo"
            width="16"
            height="16"
          />
          <span>Search parkour.spot</span>
        </button>
        {#if query}
          <button type="button" class="btn btn-ghost search-action-btn" on:click={() => goto('/spots')}>
            Reset
          </button>
        {/if}
      </svelte:fragment>
    </SearchBar>
  </form>

  {#if !query && !data.error}
    <EmptyState
      icon="🔍"
      title="Search for spots"
      message="Type a name or city above and hit Search."
    />
  {:else if filtered.length === 0 && !data.error}
    <EmptyState
      icon="🗺️"
      title="No spots found"
      message="Try a different search term."
    />
  {:else}
    <div class="grid-cards">
      {#each filtered as spot}
        {#if isAuthenticated}
          <SpotCard {spot} showActions>
            <SpotActions slot="actions" {spot} {lists} goals={allGoals} />
          </SpotCard>
        {:else}
          <SpotCard {spot} />
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .my-spots-section {
    margin-bottom: 1.5rem;
  }

  .my-map-section {
    margin-bottom: 1.5rem;
  }

  .map-card {
    padding: 0.85rem;
    display: grid;
    gap: 0.75rem;
  }

  .your-map {
    position: relative;
    z-index: 0;
    width: 100%;
    height: 360px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    overflow: hidden;
    background: var(--color-surface-2);
  }

  .your-map :global(.leaflet-pane),
  .your-map :global(.leaflet-control),
  .your-map :global(.leaflet-top),
  .your-map :global(.leaflet-bottom) {
    z-index: 1;
  }

  .map-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    flex-wrap: wrap;
    padding: 0 0.15rem;
  }

  .map-locate-btn {
    font-size: 0.82rem;
    min-height: 36px;
    padding: 0.35rem 0.85rem;
  }

  .section-header {
    margin-bottom: 0.8rem;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 700;
  }

  .my-spots-grid {
    margin-bottom: 0.5rem;
  }

  .my-spot-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .my-spot-meta {
    padding-inline: 0.15rem;
  }

  .section-divider {
    border-top: 1px solid var(--color-border);
    margin: 0.5rem 0 1.5rem;
  }

  .spots-error {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    padding: 1rem 1.25rem;
  }

  .spots-error--retry {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .spots-retry-btn {
    flex-shrink: 0;
    font-size: 0.85rem;
    padding: 0.4rem 0.9rem;
    min-height: 36px;
  }

  .search-bar {
    margin-bottom: 1.5rem;
  }

  .search-bar :global(.search-shell) {
    margin-bottom: 0;
    max-width: 920px;
  }

  .parkour-spot-logo {
    border-radius: 3px;
    flex-shrink: 0;
  }

  @media (prefers-color-scheme: dark) {
    .parkour-spot-logo {
      filter: invert(1) brightness(0.85);
    }
  }

  @media (max-width: 700px) {
    .your-map {
      height: 300px;
    }
  }
</style>
