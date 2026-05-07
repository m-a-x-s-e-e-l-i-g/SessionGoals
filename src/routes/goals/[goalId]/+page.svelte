<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getGoalById, updateGoalStatus, deleteGoal } from '$lib/data/goals';
  import { getSpotById } from '$lib/data/spots';
  import { formatGoalType, typeIcon } from '$lib/utils/format';
  import TagBadge from '$lib/components/TagBadge.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import type { GoalStatus } from '$lib/types';

  $: goalId = $page.params.goalId ?? '';
  $: goal = goalId ? getGoalById(goalId) : undefined;
  $: spot = goal?.spotId ? getSpotById(goal.spotId) : undefined;
  $: spotGoogleMapsUrl = getGoogleMapsUrl(
    spot?.coordinates?.lat,
    spot?.coordinates?.lng,
  );
  $: isAuthenticated = !!$page.data.user;
  $: currentUserId = $page.data.user?.id as string | undefined;
  $: isOwnGoal = isAuthenticated && !!currentUserId && !!goal?.userId && goal.userId === currentUserId;

  let showDeleteDialog = false;
  let isDeleting = false;
  let justChecked = false;

  // Normalize image URL - handle relative paths and ensure it's proxied
  function getProxiedImageUrl(imageUrl: string | undefined): string | undefined {
    if (!imageUrl) return undefined;

    // If already using our proxy, return as-is
    if (imageUrl.startsWith('/api/image-proxy')) {
      return imageUrl;
    }

    // If relative URL, assume it's from parkour.spot
    if (imageUrl.startsWith('/')) {
      imageUrl = `https://parkour.spot${imageUrl}`;
    }

    // Proxy through our endpoint
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }

  const googleMapsLogoUrl = '/images/icons/google-map-icon.svg';

  function getGoogleMapsUrl(
    lat: number | undefined,
    lng: number | undefined,
  ): string | null {
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

  async function handleCheckedChange(e: Event) {
    if (!goalId) return;
    const input = e.target as HTMLInputElement;
    await updateGoalStatus(goalId, input.checked ? 'done' : 'want_to_try');
    goal = getGoalById(goalId);
    if (input.checked) {
      justChecked = true;
      setTimeout(() => (justChecked = false), 2000);
    }
  }

  async function handleDelete() {
    if (!goalId) return;
    showDeleteDialog = true;
  }

  async function confirmDelete() {
    if (!goalId) return;
    isDeleting = true;
    try {
      await deleteGoal(goalId);
      goto('/goals');
    } finally {
      isDeleting = false;
    }
  }
</script>

<svelte:head>
  <title>{goal?.title ?? 'Goal'} — SessionGoals</title>
</svelte:head>

<ConfirmDialog
  isOpen={showDeleteDialog}
  title="Delete goal?"
  message="This goal will be permanently deleted. You can't undo this action."
  confirmLabel="Delete goal"
  cancelLabel="Cancel"
  isDangerous={true}
  isLoading={isDeleting}
  on:confirm={confirmDelete}
  on:cancel={() => (showDeleteDialog = false)}
/>

<div class="container page">
  {#if !goal}
    <div class="not-found">
      <h2>Goal not found</h2>
      <a href="/goals" class="btn btn-ghost">← Back to Goals</a>
    </div>
  {:else}
    <div class="page-header">
      <div>
        <a href="/goals" class="back-link text-muted text-sm">← Goals</a>
        <h1 class="page-title">{goal.title}</h1>
      </div>
      <div class="header-actions">
        {#if isOwnGoal}
          <a href="/goals/{goal.id}/edit" class="btn btn-ghost">Edit</a>
          <button class="btn btn-danger" on:click={handleDelete}>Delete</button>
        {/if}
      </div>
    </div>

    <div class="detail-layout">
      <div class="detail-main">
        <div class="meta-row">
          <span class="badge type-{goal.type}">
            {typeIcon(goal.type)} {formatGoalType(goal.type)}
          </span>
          {#if isOwnGoal}
            <label class="goal-check-toggle">
              <input type="checkbox" checked={goal.status === 'done'} on:change={handleCheckedChange} />
              <span>{goal.status === 'done' ? 'Checked' : 'Unchecked'}</span>
            </label>
          {:else}
            <span class="badge {goal.status === 'done' ? 'badge-success' : 'badge-muted'}">
              {goal.status === 'done' ? '✓ Checked' : 'Unchecked'}
            </span>
          {/if}
        </div>

        {#if justChecked}
          <p class="checked-feedback">✓ Goal checked!</p>
        {/if}

        {#if goal.description}
          <div class="description-section">
            <p class="goal-description">{goal.description}</p>
          </div>
        {/if}

        {#if spot}
          <div class="section spot-section">
            <h3 class="section-label">📍 Spot</h3>
            {#if spot.imageUrl}
              {@const proxiedImageUrl = getProxiedImageUrl(spot.imageUrl)}
              {#if proxiedImageUrl}
                <div class="spot-image-container">
                  <img 
                    src={proxiedImageUrl}
                    alt={spot.name} 
                    class="spot-image"
                    on:error={(e) => {
                      // Hide image container if load fails
                      const container = e.currentTarget.parentElement;
                      if (container) {
                        container.style.display = 'none';
                      }
                    }}
                  />
                </div>
              {/if}
            {/if}
            <div class="spot-info">
              <div class="spot-name">{spot.name}</div>
              {#if spot.city}
                <div class="text-muted text-sm">{spot.city}, {spot.country}</div>
              {/if}
              {#if spot.description}
                <div class="spot-description">{spot.description}</div>
              {/if}
            </div>
            <div class="spot-actions">
              {#if spotGoogleMapsUrl}
                <a
                  href={spotGoogleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-sm btn-ghost spot-ext-link"
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
                  class="btn btn-sm btn-ghost spot-ext-link"
                  title="View on parkour.spot"
                >
                  <img src="https://parkour.spot/favicon.ico" alt="" class="ext-logo ext-logo--parkour" width="14" height="14" aria-hidden="true" />
                  parkour.spot
                </a>
              {/if}
            </div>
          </div>
        {/if}

        {#if goal.tags.length > 0}
          <div class="section">
            <h3 class="section-label">Tags</h3>
            <div class="flex flex-wrap gap-1">
              {#each goal.tags as tag}
                <TagBadge {tag} />
              {/each}
            </div>
          </div>
        {/if}

        {#if goal.sourceUrl}
          <div class="section">
            <h3 class="section-label">Reference</h3>
            <a href={goal.sourceUrl} target="_blank" rel="noopener noreferrer" class="link-item">
              <span class="link-url-text">
                {(() => {
                  try {
                    const parsed = new URL(goal.sourceUrl);
                    return `${parsed.hostname}${parsed.pathname}`;
                  } catch {
                    return goal.sourceUrl;
                  }
                })()}
              </span>
              <span class="text-muted text-sm">↗</span>
            </a>
          </div>
        {/if}

        {#if goal.links.length > 0}
          <div class="section">
            <h3 class="section-label">Links</h3>
            <ul class="links-list">
              {#each goal.links as link}
                <li>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" class="link-item">
                    {link.title ?? link.url}
                    <span class="text-muted text-sm">↗</span>
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <div class="detail-sidebar">
        {#if goal.difficulty}
          <div class="sidebar-item">
            <span class="sidebar-label">Difficulty</span>
            <div class="difficulty-dots">
              {#each Array(5) as _, i}
                <span class="dot" class:filled={i < (goal.difficulty ?? 0)}>●</span>
              {/each}
            </div>
          </div>
        {/if}

        <div class="sidebar-item">
          <span class="sidebar-label">Created</span>
          <span class="text-sm text-muted">{new Date(goal.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem 0;
    text-align: center;
  }

  .back-link {
    display: block;
    margin-bottom: 0.25rem;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .detail-layout {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 3rem;
    align-items: start;
  }

  .detail-main {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    background: var(--color-surface-2);
    color: var(--color-text);
  }

  .goal-check-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface-2);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }

  .goal-check-toggle input {
    width: auto;
    margin: 0;
  }

  .description-section {
    margin-bottom: 2rem;
  }

  .goal-description {
    color: var(--color-text-muted);
    line-height: 1.8;
    font-size: 1rem;
  }

  .section {
    margin-bottom: 2rem;
  }

  .checked-feedback {
    color: var(--color-success);
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .section-label {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-text-muted);
    margin-bottom: 0.75rem;
    display: block;
  }

  .spot-section {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .spot-image-container {
    margin: 0 -1.5rem 1rem -1.5rem;
    overflow: hidden;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
  }

  .spot-image {
    width: 100%;
    height: 280px;
    object-fit: cover;
    display: block;
  }

  .spot-info {
    margin-bottom: 1rem;
  }

  .spot-name {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 0.3rem;
  }

  .spot-description {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    line-height: 1.6;
    margin-top: 0.75rem;
  }

  .spot-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    color: var(--color-text);
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s;
  }

  .btn:hover {
    border-color: var(--color-primary);
    background: var(--color-surface);
  }

  .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-dark, #0066cc);
    border-color: var(--color-primary-dark, #0066cc);
  }

  .btn-danger {
    background: rgba(242, 78, 78, 0.1);
    border-color: var(--color-danger);
    color: var(--color-danger);
  }

  .btn-danger:hover {
    background: rgba(242, 78, 78, 0.15);
  }

  .btn-ghost {
    background: transparent;
    border-color: transparent;
    color: var(--color-text);
  }

  .btn-ghost:hover {
    background: var(--color-surface-2);
    border-color: var(--color-border);
  }

  .btn-sm {
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
  }

  .spot-ext-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
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

  .links-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .link-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.95rem;
    transition: color 0.15s;
  }

  .link-item:hover {
    color: var(--color-primary-dark, #0066cc);
    text-decoration: underline;
  }

  .link-url-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 40ch;
    display: inline-block;
    vertical-align: bottom;
  }

  .detail-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    height: fit-content;
    position: sticky;
    top: calc(60px + var(--space-md));
  }

  .sidebar-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sidebar-label {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-text-muted);
  }

  .difficulty-dots {
    display: flex;
    gap: 4px;
    font-size: 0.9rem;
  }

  .dot {
    color: var(--color-border);
    transition: color 0.15s;
  }

  .dot.filled {
    color: var(--color-primary);
  }

  @media (max-width: 900px) {
    .detail-layout {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .detail-sidebar {
      position: static;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
  }

  @media (max-width: 640px) {
    .detail-layout {
      gap: 1.5rem;
    }

    .detail-sidebar {
      grid-template-columns: 1fr;
    }

    .meta-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .spot-image {
      height: 200px;
    }

    .spot-actions {
      gap: 0.4rem;
    }

    .btn {
      flex: 1;
      justify-content: center;
    }
  }
</style>
