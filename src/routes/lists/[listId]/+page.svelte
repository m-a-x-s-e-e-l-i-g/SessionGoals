<script lang="ts">
  import { page } from '$app/stores';
  import { getListById, deleteList, updateList } from '$lib/data/lists';
  import type { GoalListType, GoalListVisibility } from '$lib/types';
  import { goto } from '$app/navigation';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { formatListType, formatListVisibility } from '$lib/utils/format';
  import { getUserDisplayName } from '$lib/data/session';
  import { enrollStudentToPublicList } from '$lib/data/coaching';
  import { getStudentsForTeacher, getUserById, isTeacher } from '$lib/data/users';
  import { getSpotById } from '$lib/data/spots';
  import { updateGoalStatus } from '$lib/data/goals';
  import {
    getProgressForList,
    startTrackingList,
    toggleListItemProgress,
  } from '$lib/data/listProgress';
  import type { ListProgress, UserProfile, GoalStatus } from '$lib/types';
  import { appStateStore } from '$lib/data/state';

  $: isAuthenticated = !!$page.data.user;
  $: currentUserId = $page.data.user?.id;
  $: listId = $page.params.listId ?? '';
  // Re-derives whenever appState store emits (covers goal status updates, list item changes)
  $: list = $appStateStore.lists.find((l) => l.id === listId);
  $: isOwnList = isAuthenticated && !!currentUserId && list?.userId === currentUserId;
  $: canViewList = !!list && (isOwnList || list.visibility === 'public');
  $: canTrackList = isAuthenticated && !!list && !isOwnList && list.visibility === 'public';
  $: currentUser = currentUserId ? getUserById(currentUserId) : undefined;
  $: canEnrollStudents = isAuthenticated && !!list && list.visibility === 'public' && isTeacher(currentUser);
  $: teacherStudents = canEnrollStudents && currentUserId ? getStudentsForTeacher(currentUserId) : [];

  let enrollmentNotice = '';
  let showDeleteDialog = false;
  let isDeleting = false;
  let showEditForm = false;
  let editName = '';
  let editDescription = '';
  let editType: GoalListType = 'general';
  let editVisibility: GoalListVisibility = 'private';
  let isSaving = false;
  let editError: string | undefined;

  function openEditForm() {
    if (!list) return;
    editName = list.name;
    editDescription = list.description ?? '';
    editType = list.type;
    editVisibility = list.visibility;
    editError = undefined;
    showEditForm = true;
  }

  function closeEditForm() {
    showEditForm = false;
  }

  async function handleSaveEdit() {
    if (!list || !editName.trim()) {
      editError = 'Name is required.';
      return;
    }
    isSaving = true;
    editError = undefined;
    try {
      await updateList(list.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        type: editType,
        visibility: editVisibility,
      });
      showEditForm = false;
    } catch {
      editError = 'Failed to save changes.';
    } finally {
      isSaving = false;
    }
  }

  // Re-derives whenever appState changes (covers toggleListItemProgress updates)
  $: progress =
    list && isAuthenticated && currentUserId
      ? $appStateStore.progress.find(
          (p) => p.sourceListId === list.id && p.userId === currentUserId,
        )
      : undefined;

  $: doneCount = progress ? progress.items.filter((item) => item.done).length : 0;
  $: totalCount = progress ? progress.items.length : 0;
  $: progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  async function handleDelete() {
    if (!listId) return;
    showDeleteDialog = true;
  }

  async function confirmDelete() {
    if (!listId) return;
    isDeleting = true;
    try {
      await deleteList(listId);
      goto('/lists');
    } finally {
      isDeleting = false;
    }
  }

  async function handleStartTracking() {
    if (!list || !currentUserId) return;
    await startTrackingList(list, currentUserId);
    // progress re-derives automatically via $appStateStore subscription
  }

  async function handleToggleProgress(goalId: string) {
    if (!list || !currentUserId) return;
    await toggleListItemProgress(list.id, goalId, currentUserId);
    // progress re-derives automatically via $appStateStore subscription
  }

  let expandedGoalIds = new Set<string>();

  function toggleExpand(goalId: string) {
    if (expandedGoalIds.has(goalId)) {
      expandedGoalIds.delete(goalId);
    } else {
      expandedGoalIds.add(goalId);
    }
    expandedGoalIds = expandedGoalIds; // trigger reactivity
  }

  async function handleToggleGoalDone(goalId: string, currentStatus: GoalStatus) {
    const next: GoalStatus = currentStatus === 'done' ? 'want_to_try' : 'done';
    await updateGoalStatus(goalId, next);
    // list + progress re-derive automatically via $appStateStore subscription
  }

  function difficultyLabel(d: number) {
    return ['', '★', '★★', '★★★', '★★★★', '★★★★★'][d] ?? '';
  }

  function isStudentEnrolled(studentId: string): boolean {
    if (!list) return false;
    return !!getProgressForList(list.id, studentId);
  }

  async function handleEnrollStudent(studentId: string, studentName: string) {
    if (!list || !currentUserId) return;
    const result = await enrollStudentToPublicList(currentUserId, studentId, list.id);
    if (!result.ok) {
      enrollmentNotice = `Could not enroll ${studentName}.`;
      return;
    }
    enrollmentNotice = result.alreadyEnrolled
      ? `${studentName} is already following this list.`
      : `${studentName} is now following this list.`;
  }

  async function handleEnrollAll(students: UserProfile[]) {
    if (!list || !currentUserId) return;
    let newlyEnrolled = 0;
    for (const student of students) {
      const result = await enrollStudentToPublicList(currentUserId, student.id, list.id);
      if (result.ok && !result.alreadyEnrolled) newlyEnrolled += 1;
    }
    if (newlyEnrolled === 0) {
      enrollmentNotice = 'All assigned students are already following this list.';
      return;
    }
    enrollmentNotice = `${newlyEnrolled} student${newlyEnrolled === 1 ? '' : 's'} enrolled successfully.`;
  }
</script>

<ConfirmDialog
  isOpen={showDeleteDialog}
  title="Delete list?"
  message="This list and all of its goals will be permanently deleted. You can't undo this action."
  confirmLabel="Delete list"
  cancelLabel="Cancel"
  isDangerous={true}
  isLoading={isDeleting}
  on:confirm={confirmDelete}
  on:cancel={() => (showDeleteDialog = false)}
/>

<svelte:head>
  <title>{list?.name ?? 'List'} — SessionGoals</title>
</svelte:head>

<div class="container page">
  {#if !list}
    <div class="not-found">
      <h2>List not found</h2>
      <a href="/lists" class="btn btn-ghost">← Back to Lists</a>
    </div>
  {:else if !canViewList}
    <div class="not-found">
      <h2>This list is private</h2>
      <p class="text-muted">Only the owner can view this list.</p>
      <a href="/lists" class="btn btn-ghost">← Back to Lists</a>
    </div>
  {:else}
    <div class="page-header">
      <div>
        <a href="/lists" class="back-link text-muted text-sm">← Lists</a>
        <h1 class="page-title">{list.name}</h1>
        {#if list.userId}
          <p class="text-muted text-sm owner-line">
            By <a href="/people/{list.userId}" class="owner-link">{getUserDisplayName(list.userId)}</a>
          </p>
        {/if}
      </div>
      <div style="display:flex;gap:0.5rem;">
        {#if isOwnList}
          <button class="btn btn-ghost" on:click={openEditForm}>Edit</button>
          <button class="btn btn-danger" on:click={handleDelete}>Delete</button>
        {:else if canTrackList && !progress}
          <button class="btn btn-primary" on:click={handleStartTracking}>Track This List</button>
        {:else if !isAuthenticated}
          <a class="btn btn-primary" href="/auth/login?next=/lists/{list.id}">Sign in to Track</a>
        {/if}
      </div>
    </div>

    {#if showEditForm}
      <div class="edit-panel card">
        <h2 class="edit-title">Edit List</h2>
        <div class="form-group">
          <label for="edit-name">Name *</label>
          <input id="edit-name" type="text" bind:value={editName} placeholder="List name" />
        </div>
        <div class="form-group">
          <label for="edit-description">Description</label>
          <textarea id="edit-description" bind:value={editDescription} placeholder="What is this list for?"></textarea>
        </div>
        <div class="edit-row">
          <div class="form-group">
            <label for="edit-type">Type</label>
            <select id="edit-type" bind:value={editType}>
              <option value="training_plan">Training Plan</option>
              <option value="competition">Competition</option>
              <option value="wishlist">Wishlist</option>
              <option value="general">General</option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-visibility">Visibility</label>
            <select id="edit-visibility" bind:value={editVisibility}>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>
        {#if editError}
          <p class="edit-error">{editError}</p>
        {/if}
        <div class="edit-actions">
          <button class="btn btn-primary" on:click={handleSaveEdit} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
          <button class="btn btn-ghost" on:click={closeEditForm} disabled={isSaving}>Cancel</button>
        </div>
      </div>
    {/if}

    <div class="list-meta">
      <span class="badge list-type-badge">{formatListType(list.type)}</span>
      <span class="badge list-visibility-badge visibility-{list.visibility}">
        {formatListVisibility(list.visibility)}
      </span>
      {#if list.description}
        <p class="text-muted">{list.description}</p>
      {/if}
    </div>

    {#if canEnrollStudents}
      <div class="enroll-panel card">
        <div class="enroll-header">
          <h2 class="enroll-title">Enroll Students</h2>
          {#if teacherStudents.length > 1}
            <button class="btn btn-ghost enroll-all-btn" on:click={() => handleEnrollAll(teacherStudents)}>
              Enroll All
            </button>
          {/if}
        </div>
        <p class="text-muted text-sm enroll-help">
          Enrolled students will automatically start following this public list.
        </p>
        {#if teacherStudents.length === 0}
          <p class="text-muted text-sm">No assigned students available.</p>
        {:else}
          <div class="enroll-grid">
            {#each teacherStudents as student}
              {@const enrolled = isStudentEnrolled(student.id)}
              <div class="enroll-row">
                <div class="enroll-student">
                  <strong>{student.displayName}</strong>
                  <span class="text-muted text-sm">@{student.username}</span>
                </div>
                <button
                  class="btn {enrolled ? 'btn-ghost' : 'btn-primary'} enroll-btn"
                  on:click={() => handleEnrollStudent(student.id, student.displayName)}
                  disabled={enrolled}
                >
                  {enrolled ? 'Enrolled' : 'Enroll'}
                </button>
              </div>
            {/each}
          </div>
        {/if}
        {#if enrollmentNotice}
          <p class="enroll-notice text-sm">{enrollmentNotice}</p>
        {/if}
      </div>
    {/if}

    {#if canTrackList && progress}
      <div class="progress-panel card">
        <div class="progress-header">
          <div>
            <h2 class="progress-title">Your Progress</h2>
            <span class="badge">{doneCount}/{totalCount}</span>
          </div>
          <div class="progress-percent-wrap" aria-label={`Progress ${progressPercent}%`}>
            <span class="progress-percent">{progressPercent}%</span>
          </div>
        </div>
        <div class="progress-bar" role="img" aria-label={`Completed ${doneCount} of ${totalCount} goals`}>
          <div class="progress-bar-fill" style={`transform: scaleX(${progressPercent / 100})`}></div>
        </div>
      </div>
    {/if}

    {#if isOwnList}
      <div class="list-add-bar">
        <a href="/goals/new?listId={list.id}" class="btn btn-ghost list-add-btn">+ Add goal to list</a>
      </div>
    {/if}

    {#if list.items.length === 0}
      <EmptyState
        icon="🎯"
        title="No goals in this list"
        message="Add goals to this list to start planning your session."
        actionHref="/goals/new?listId={list.id}"
        actionLabel="Create a Goal"
      />
    {:else}
      <ol class="goal-checklist">
        {#each list.items.sort((a, b) => a.position - b.position) as item}
          {#if item.goal}
            {@const goal = item.goal}
            {@const done = isOwnList
              ? goal.status === 'done'
              : !!progress?.items.find((p) => p.goalId === item.goalId)?.done}
            {@const expanded = expandedGoalIds.has(item.goalId)}
            {@const spot = goal.spotId ? getSpotById(goal.spotId) : undefined}
            <li class="checklist-row" class:is-done={done} class:is-expanded={expanded}>
              <!-- tick -->
              {#if isOwnList}
                <button
                  type="button"
                  class="tick-btn"
                  class:ticked={done}
                  on:click|stopPropagation={() => handleToggleGoalDone(item.goalId, goal.status)}
                  aria-label={done ? 'Mark as not done' : 'Mark as done'}
                  aria-pressed={done}
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    {#if done}
                      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15"/>
                      <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    {/if}
                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </button>
              {:else if progress}
                <button
                  type="button"
                  class="tick-btn"
                  class:ticked={done}
                  on:click|stopPropagation={() => handleToggleProgress(item.goalId)}
                  aria-label={done ? 'Mark as not done' : 'Mark as done'}
                  aria-pressed={done}
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    {#if done}
                      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15"/>
                      <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    {/if}
                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </button>
              {:else}
                <span class="item-num">{item.position}</span>
              {/if}

              <!-- main row body: click to expand -->
              <button type="button" class="checklist-body" on:click={() => toggleExpand(item.goalId)}>
                <span class="checklist-top-row">
                  <span class="checklist-goal-title">{goal.title}</span>
                  <span class="checklist-chevron" class:open={expanded} aria-hidden="true">›</span>
                </span>
                <span class="checklist-goal-meta">
                  {#if done}
                    <span class="badge status-done">Checked</span>
                  {/if}
                  {#if goal.type !== 'move'}
                    <span class="badge type-{goal.type}">{goal.type}</span>
                  {/if}
                  {#if goal.difficulty}
                    <span class="difficulty-stars">{difficultyLabel(goal.difficulty)}</span>
                  {/if}
                </span>
              </button>

              <!-- open-in-full link -->
              <a href="/goals/{goal.id}" class="open-link" aria-label="Open goal" title="Open full goal">
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="14" height="14">
                  <path d="M10 2h4v4M14 2l-6 6M6 4H3a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>

              <!-- expanded details -->
              {#if expanded}
                <div class="checklist-details">
                  {#if goal.description}
                    <p class="detail-description">{goal.description}</p>
                  {/if}
                  {#if spot}
                    <div class="detail-row">
                      <span class="detail-label">Spot</span>
                      <a href="/spots" class="detail-value detail-link">{spot.name}</a>
                    </div>
                  {/if}
                  {#if goal.sourceUrl}
                    <div class="detail-row">
                      <span class="detail-label">Reference</span>
                      <a href={goal.sourceUrl} class="detail-value detail-link" target="_blank" rel="noopener">{goal.sourceUrl}</a>
                    </div>
                  {/if}
                  {#if goal.links.length > 0}
                    <div class="detail-row detail-row--links">
                      <span class="detail-label">Links</span>
                      <span class="detail-links">
                        {#each goal.links as link}
                          <a href={link.url} class="detail-link" target="_blank" rel="noopener">{link.title ?? link.platform ?? link.url}</a>
                        {/each}
                      </span>
                    </div>
                  {/if}
                  {#if goal.tags.length > 0}
                    <div class="detail-tags">
                      {#each goal.tags as tag}
                        <span class="badge">{tag.name}</span>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
            </li>
          {/if}
        {/each}
      </ol>
    {/if}
  {/if}
</div>

<style>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem 0;
  }

  .back-link {
    display: block;
    margin-bottom: 0.25rem;
  }

  .owner-line {
    margin-top: 0.25rem;
  }

  .owner-link {
    color: inherit;
    text-underline-offset: 2px;
  }

  .list-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
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

  /* ── Goal checklist ─────────────────────────────────────────────────── */
  .goal-checklist {
    list-style: none;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .checklist-row {
    display: grid;
    grid-template-columns: 52px 1fr 36px;
    grid-template-rows: auto;
    grid-template-areas: 'tick body open';
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    transition: background 0.12s;
  }

  .checklist-row:last-child {
    border-bottom: none;
  }

  .checklist-row.is-expanded {
    background: var(--color-surface-2);
  }

  .checklist-row.is-done {
    background: color-mix(in oklch, var(--color-surface) 60%, var(--color-surface-2));
  }

  .tick-btn {
    grid-area: tick;
    width: 52px;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-border);
    transition: color 0.2s, transform 0.15s;
    padding: 0;
    align-self: start;
    padding-top: 17px;
  }

  .tick-btn svg {
    width: 22px;
    height: 22px;
    overflow: visible;
  }

  .tick-btn:hover {
    color: var(--color-primary);
    transform: scale(1.1);
  }

  .tick-btn.ticked {
    color: var(--color-primary);
    animation: tick-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .tick-btn:not(.ticked) {
    animation: tick-unpop 0.18s ease-out;
  }

  @keyframes tick-pop {
    0%   { transform: scale(0.8); }
    60%  { transform: scale(1.18); }
    100% { transform: scale(1); }
  }

  @keyframes tick-unpop {
    0%   { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .item-num {
    grid-area: tick;
    width: 52px;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--color-text-muted);
    align-self: start;
  }

  .checklist-body {
    grid-area: body;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.9rem 0.5rem 0.9rem 0;
    min-height: 56px;
    justify-content: center;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    font: inherit;
    color: inherit;
    width: 100%;
  }

  .checklist-body:hover .checklist-goal-title {
    color: var(--color-primary);
  }

  .checklist-top-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .checklist-goal-title {
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1.3;
    transition: color 0.12s;
    flex: 1;
  }

  .checklist-chevron {
    font-size: 1rem;
    color: var(--color-text-muted);
    transition: transform 0.18s;
    display: inline-block;
    line-height: 1;
  }

  .checklist-chevron.open {
    transform: rotate(90deg);
  }

  .checklist-row.is-done .checklist-goal-title {
    text-decoration: line-through;
    color: var(--color-text-muted);
  }

  .checklist-goal-meta {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .difficulty-stars {
    font-size: 0.7rem;
    color: var(--color-accent, oklch(0.72 0.18 55));
    letter-spacing: -0.05em;
  }

  .open-link {
    grid-area: open;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: start;
    padding-top: 19px;
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color 0.15s;
  }

  .open-link:hover {
    color: var(--color-primary);
    text-decoration: none;
  }

  /* Expanded details panel — spans all columns */
  .checklist-details {
    grid-column: 1 / -1;
    padding: 0 1rem 1rem 52px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-description {
    font-size: 0.88rem;
    color: var(--color-text-muted);
    line-height: 1.55;
    max-width: 60ch;
  }

  .detail-row {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    font-size: 0.83rem;
  }

  .detail-label {
    color: var(--color-text-muted);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .detail-value {
    color: var(--color-text);
  }

  .detail-link {
    color: var(--color-primary);
    text-decoration: none;
    word-break: break-all;
  }

  .detail-link:hover {
    text-decoration: underline;
  }

  .detail-row--links .detail-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .detail-tags {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .enroll-panel {
    margin: 1rem 0 1.2rem;
    padding: 1rem;
  }

  .enroll-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    margin-bottom: 0.3rem;
  }

  .enroll-title {
    font-family: var(--font-display);
    font-size: 1.15rem;
  }

  .enroll-all-btn {
    min-height: 34px;
    font-size: 0.82rem;
  }

  .enroll-help {
    margin-bottom: 0.7rem;
  }

  .enroll-grid {
    display: grid;
    gap: 0.45rem;
  }

  .enroll-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.65rem;
    background: var(--color-surface);
  }

  .enroll-student {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .enroll-btn {
    min-height: 34px;
    min-width: 84px;
    font-size: 0.82rem;
  }

  .enroll-notice {
    margin-top: 0.65rem;
    color: color-mix(in oklch, var(--color-primary) 70%, black);
    font-weight: 600;
  }

  .progress-panel {
    margin: 1rem 0 1.5rem;
    padding: 1rem;
  }

  .progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.4rem;
  }

  .progress-title {
    font-family: var(--font-display);
    font-size: 1.1rem;
  }

  .progress-percent-wrap {
    line-height: 1;
  }

  .progress-percent {
    font-family: var(--font-display);
    font-size: clamp(2.1rem, 6vw, 3rem);
    font-weight: 800;
    color: var(--color-primary);
    letter-spacing: -0.02em;
  }

  .progress-bar {
    height: 10px;
    border-radius: 999px;
    margin-bottom: 0.85rem;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(
      90deg,
      color-mix(in oklch, var(--color-primary) 65%, black),
      var(--color-primary)
    );
    transform-origin: left;
    transform: scaleX(0);
    transition: transform 0.2s ease;
  }

  .edit-panel {
    margin-bottom: 1.5rem;
    padding: 1.25rem;
  }

  .edit-title {
    font-family: var(--font-display);
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  .edit-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .edit-error {
    color: var(--color-danger);
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .list-add-bar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
  }

  .list-add-btn {
    font-size: 0.88rem;
  }

  @media (max-width: 640px) {
    .edit-row {
      grid-template-columns: 1fr;
    }
  }
</style>
