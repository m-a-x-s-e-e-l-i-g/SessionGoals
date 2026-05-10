<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { commitToLibrary, deleteLibraryMove, createGoal, getGoalById, getGoals, updateGoalStatus, deleteGoal } from '$lib/data/goals';
  import { getSpotById } from '$lib/data/spots';
  import { addGoalToList } from '$lib/data/lists';
  import { appStateStore } from '$lib/data/state';
  import { formatGoalType, typeIcon } from '$lib/utils/format';
  import { getGoalVisualImageUrl } from '$lib/utils/media';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import type { CreateGoalInput, GoalStatus } from '$lib/types';

  $: goalId = $page.params.goalId ?? '';
  $: goal = goalId ? getGoalById(goalId) : undefined;
  $: spot = goal?.spotId ? getSpotById(goal.spotId) : undefined;
  $: goalVisualImageUrl = goal ? getGoalVisualImageUrl(goal) : null;
  $: spotGoogleMapsUrl = getGoogleMapsUrl(
    spot?.coordinates?.lat,
    spot?.coordinates?.lng,
  );
  $: isAuthenticated = !!$page.data.user;
  $: currentUserId = $page.data.user?.id as string | undefined;
  $: isOwnGoal = isAuthenticated && !!currentUserId && !!goal?.userId && goal.userId === currentUserId;
  $: isAdoptedGoal = !!goal?.sourceGoalId;
  $: myGoals = currentUserId ? getGoals().filter((entry) => entry.userId === currentUserId) : [];
  $: goalById = new Map(getGoals().map((g) => [g.id, g]));
  $: allUsers = ($page.data.appState?.users ?? []) as import('$lib/types').UserProfile[];
  $: isAdmin = allUsers.some((u) => u.id === currentUserId && u.isAdmin);

  // Follow sourceGoalId chain to root, with cycle guard
  function resolveRootGoalId(goalId: string): string {
    const visited = new Set<string>();
    let current = goalId;
    while (true) {
      if (visited.has(current)) break;
      visited.add(current);
      const g = goalById.get(current);
      if (!g?.sourceGoalId) break;
      current = g.sourceGoalId;
    }
    return current;
  }

  // Set of root IDs for every goal the current user owns (originals + tracked copies)
  $: myGoalRootIds = new Set(myGoals.map((g) => resolveRootGoalId(g.id)));

  // If user already has any goal tracing back to the same root, find it to link to
  $: existingMineForCurrentGoal = goal
    ? myGoals.find((entry) => resolveRootGoalId(entry.id) === resolveRootGoalId(goal!.id))
    : undefined;

  // Lists containing this goal
  $: myLists = isAuthenticated && currentUserId
    ? $appStateStore.lists.filter((l) => l.userId === currentUserId)
    : [];
  $: listsContainingGoal = goal
    ? $appStateStore.lists.filter((l) => l.items.some((item) => item.goalId === goal!.id))
    : [];
  $: myListsContaining = listsContainingGoal.filter((l) => l.userId === currentUserId);
  $: publicListsContaining = listsContainingGoal.filter(
    (l) => l.visibility === 'public' && l.userId !== currentUserId,
  );
  $: addableMyLists = myLists.filter(
    (l) => !l.items.some((item) => item.goalId === goal?.id),
  );

  let showDeleteDialog = false;
  let isDeleting = false;
  let justChecked = false;
  let addError: string | undefined;
  let addingToMine = false;
  let showListPicker = false;
  let addingToListId: string | null = null;
  let addToListError: string | undefined;

  async function handleAddToList(listId: string) {
    if (!goal) return;
    addingToListId = listId;
    addToListError = undefined;
    try {
      await addGoalToList(listId, goal);
      showListPicker = false;
    } catch {
      addToListError = 'Failed to add to list.';
    } finally {
      addingToListId = null;
    }
  }

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

  function toGoalCopyInput() {
    if (!goal) return null;
    const input: CreateGoalInput = {
      type: goal.type,
      sourceGoalId: goal.id,
      title: goal.title,
      status: 'want_to_try',
    };
    return input;
  }

  async function handleAddToMine() {
    if (!goal) return;
    if (!isAuthenticated) {
      goto('/auth/login');
      return;
    }

    const input = toGoalCopyInput();
    if (!input) return;

    if (existingMineForCurrentGoal) {
      goto(`/goals/${existingMineForCurrentGoal.id}`);
      return;
    }

    addingToMine = true;
    addError = undefined;

    try {
      const createdGoal = await createGoal(input);
      goto(`/goals/${createdGoal.id}`);
    } catch {
      addError = 'Failed to add this goal. Please try again.';
      addingToMine = false;
    }
  }

  let committingToLibrary = false;
  let commitFeedback: string | undefined = undefined;

  async function handleCommitToLibrary() {
    if (!goal || !isAdmin) return;
    committingToLibrary = true;
    commitFeedback = undefined;
    try {
      await commitToLibrary(goal.id);
      commitFeedback = `"${goal.title}" has been committed to the permanent library.`;
    } catch (err: unknown) {
      commitFeedback = err instanceof Error ? err.message : 'Failed to commit this move.';
    } finally {
      committingToLibrary = false;
    }
  }

  let removingFromLibrary = false;

  async function handleRemoveFromLibrary() {
    if (!goal || !isAdmin) return;
    if (!confirm(`Remove "${goal.title}" from the permanent library?`)) return;
    removingFromLibrary = true;
    try {
      await deleteLibraryMove(goal.id);
      goto('/inspiration');
    } catch {
      commitFeedback = 'Failed to remove this library entry.';
    } finally {
      removingFromLibrary = false;
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
          {#if !isAdoptedGoal}
            <a href="/goals/{goal.id}/edit" class="btn btn-ghost">Edit</a>
            <button class="btn btn-danger" on:click={handleDelete}>Delete</button>
          {:else}
            <button class="btn btn-danger" on:click={handleDelete}>Remove</button>
          {/if}
        {:else if isAuthenticated}
          {#if existingMineForCurrentGoal}
            <a href="/goals/{existingMineForCurrentGoal.id}" class="btn btn-ghost">In My Goals</a>
          {:else}
            <button class="btn btn-primary" on:click={handleAddToMine} disabled={addingToMine}>
              {addingToMine ? 'Adding...' : '+ Add To My Goals'}
            </button>
          {/if}
        {/if}
        {#if isAdmin && goal.type === 'move'}
          {#if goal.isLibraryEntry}
            <a href="/goals/{goal.id}/edit" class="btn btn-ghost">Edit Library Entry</a>
            <button class="btn btn-danger" on:click={handleRemoveFromLibrary} disabled={removingFromLibrary}>
              {removingFromLibrary ? 'Removing…' : 'Remove from Library'}
            </button>
          {:else}
            <button class="btn btn-ghost" on:click={handleCommitToLibrary} disabled={committingToLibrary}>
              {committingToLibrary ? 'Committing…' : '📌 Commit to Library'}
            </button>
          {/if}
        {/if}
      </div>
    </div>

    {#if commitFeedback}
      <p class="form-hint">{commitFeedback}</p>
    {/if}

    {#if addError}
      <p class="form-error">{addError}</p>
    {/if}

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

        {#if isOwnGoal && isAdoptedGoal}
          <p class="text-muted text-sm">This goal was added from another athlete. You can track it, but details are read-only.</p>
        {/if}

        {#if justChecked}
          <p class="checked-feedback">✓ Goal checked!</p>
        {/if}

        {#if goalVisualImageUrl}
          <div class="move-preview-wrap">
            <img
              src={goalVisualImageUrl}
              alt="{goal.title} preview"
              class="move-preview-image"
              loading="lazy"
              on:error={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
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
        <!-- Lists section -->
        <div class="sidebar-item">
          <span class="sidebar-label">Lists</span>
          {#if myListsContaining.length > 0 || publicListsContaining.length > 0}
            <div class="lists-chips">
              {#each myListsContaining as list}
                <a href="/lists/{list.id}" class="list-chip list-chip--mine">{list.name}</a>
              {/each}
              {#each publicListsContaining as list}
                <a href="/lists/{list.id}" class="list-chip list-chip--public">{list.name}</a>
              {/each}
            </div>
          {:else}
            <span class="text-sm text-muted">Not in any list</span>
          {/if}
          {#if isAuthenticated}
            {#if !showListPicker}
              <button
                class="btn btn-sm btn-ghost list-add-btn"
                on:click={() => (showListPicker = true)}
              >+ Add to list</button>
            {:else}
              <div class="list-picker">
                {#if myLists.length === 0}
                  <span class="text-sm text-muted">You have no lists yet.</span>
                  <a href="/lists/new" class="btn btn-sm btn-ghost">Create a list</a>
                {:else if addableMyLists.length === 0}
                  <span class="text-sm text-muted">Already in all your lists.</span>
                {:else}
                  {#each addableMyLists as list}
                    <button
                      class="list-pick-btn"
                      disabled={addingToListId === list.id}
                      on:click={() => handleAddToList(list.id)}
                    >
                      <span class="list-pick-name">{list.name}</span>
                      {#if addingToListId === list.id}
                        <span class="text-muted">…</span>
                      {:else}
                        <span class="list-pick-add">+</span>
                      {/if}
                    </button>
                  {/each}
                {/if}
                {#if addToListError}
                  <p class="list-pick-error">{addToListError}</p>
                {/if}
                <button
                  class="btn btn-sm btn-ghost"
                  on:click={() => { showListPicker = false; addToListError = undefined; }}
                >Cancel</button>
              </div>
            {/if}
          {/if}
        </div>

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

  .form-error {
    color: var(--color-danger);
    font-size: 0.85rem;
    padding: 0.5rem;
    background: rgba(242, 78, 78, 0.1);
    border-radius: var(--radius-sm);
    margin-bottom: 1rem;
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

  .move-preview-wrap {
    margin-bottom: 1.25rem;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid var(--color-border);
    background: var(--color-surface-2);
  }

  .move-preview-image {
    width: 100%;
    max-height: 420px;
    object-fit: cover;
    display: block;
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

  .lists-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }

  .list-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.15s;
  }

  .list-chip:hover {
    opacity: 0.8;
    text-decoration: none;
  }

  .list-chip--mine {
    background: color-mix(in oklch, var(--color-primary) 14%, var(--color-surface-2));
    color: color-mix(in oklch, var(--color-primary) 70%, black);
    border: 1px solid color-mix(in oklch, var(--color-primary) 35%, var(--color-border));
  }

  .list-chip--public {
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }

  .list-add-btn {
    align-self: flex-start;
    margin-top: 0.25rem;
  }

  .list-picker {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-top: 0.25rem;
    padding: 0.75rem;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
  }

  .list-pick-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.45rem 0.65rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: 0.85rem;
    color: var(--color-text);
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s, background 0.15s;
  }

  .list-pick-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    background: color-mix(in oklch, var(--color-primary) 6%, var(--color-surface));
  }

  .list-pick-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .list-pick-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .list-pick-add {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .list-pick-error {
    font-size: 0.8rem;
    color: var(--color-danger);
    margin: 0;
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
