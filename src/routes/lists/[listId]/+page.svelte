<script lang="ts">
  import { page } from '$app/stores';
  import { getListById, deleteList } from '$lib/data/lists';
  import { goto } from '$app/navigation';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { formatListType, formatListVisibility } from '$lib/utils/format';
  import { getUserDisplayName } from '$lib/data/session';
  import { enrollStudentToPublicList } from '$lib/data/coaching';
  import { getStudentsForTeacher, getUserById, isTeacher } from '$lib/data/users';
  import {
    getProgressForList,
    startTrackingList,
    toggleListItemProgress,
  } from '$lib/data/listProgress';
  import type { ListProgress, UserProfile } from '$lib/types';

  $: isAuthenticated = !!$page.data.user;
  $: currentUserId = $page.data.user?.id;
  $: listId = $page.params.listId ?? '';
  $: list = listId ? getListById(listId) : undefined;
  $: isOwnList = isAuthenticated && !!currentUserId && list?.userId === currentUserId;
  $: canViewList = !!list && (isOwnList || list.visibility === 'public');
  $: canTrackList = isAuthenticated && !!list && !isOwnList && list.visibility === 'public';
  $: currentUser = currentUserId ? getUserById(currentUserId) : undefined;
  $: canEnrollStudents = isAuthenticated && !!list && list.visibility === 'public' && isTeacher(currentUser);
  $: teacherStudents = canEnrollStudents && currentUserId ? getStudentsForTeacher(currentUserId) : [];

  let progress: ListProgress | undefined = undefined;
  let enrollmentNotice = '';
  let showDeleteDialog = false;
  let isDeleting = false;

  $: if (list && isAuthenticated) {
    progress = getProgressForList(list.id, currentUserId);
  } else {
    progress = undefined;
  }

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
    progress = await startTrackingList(list, currentUserId);
  }

  async function handleToggleProgress(goalId: string) {
    if (!list || !currentUserId) return;
    const updated = await toggleListItemProgress(list.id, goalId, currentUserId);
    if (updated) progress = updated;
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
          <button class="btn btn-danger" on:click={handleDelete}>Delete</button>
        {:else if canTrackList && !progress}
          <button class="btn btn-primary" on:click={handleStartTracking}>Track This List</button>
        {:else if !isAuthenticated}
          <a class="btn btn-primary" href="/auth/login?next=/lists/{list.id}">Sign in to Track</a>
        {/if}
      </div>
    </div>

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
            <h2 class="progress-title">Your Progress on This List</h2>
            <span class="badge">{doneCount}/{totalCount}</span>
          </div>
          <div class="progress-percent-wrap" aria-label={`Progress ${progressPercent}%`}>
            <span class="progress-percent">{progressPercent}%</span>
          </div>
        </div>
        <div class="progress-bar" role="img" aria-label={`Completed ${doneCount} of ${totalCount} goals`}>
          <div class="progress-bar-fill" style={`transform: scaleX(${progressPercent / 100})`}></div>
        </div>
        <div class="progress-items">
          {#each list.items.sort((a, b) => a.position - b.position) as item}
            {#if item.goal}
              {@const done = !!progress.items.find((p) => p.goalId === item.goalId)?.done}
              <label class="progress-item">
                <input
                  type="checkbox"
                  checked={done}
                  on:change={() => handleToggleProgress(item.goalId)}
                />
                <span class:done>{item.goal.title}</span>
              </label>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    {#if list.items.length === 0}
      <EmptyState
        icon="🎯"
        title="No goals in this list"
        message="Add goals to this list to start planning your session."
        actionHref="/goals/new"
        actionLabel="Create a Goal"
      />
    {:else}
      <div class="grid-cards mt-2">
        {#each list.items.sort((a, b) => a.position - b.position) as item}
          {#if item.goal}
            {@const done = !!progress?.items.find((p) => p.goalId === item.goalId)?.done}
            <div class="list-item" class:completed={done}>
              <span class="item-position">{item.position}</span>
              <div class="item-card">
                {#if done}
                  <span class="item-complete-badge">Done</span>
                {/if}
                <GoalCard goal={item.goal} />
              </div>
            </div>
          {/if}
        {/each}
      </div>
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

  .list-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .item-position {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    flex-shrink: 0;
    margin-top: 1.5rem;
  }

  .item-card {
    flex: 1;
    position: relative;
  }

  .item-complete-badge {
    position: absolute;
    top: 0.55rem;
    right: 0.55rem;
    z-index: 2;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    border-radius: 999px;
    padding: 0.18rem 0.5rem;
    border: 1px solid color-mix(in oklch, var(--color-primary) 55%, var(--color-border));
    background: color-mix(in oklch, var(--color-primary) 16%, white);
    color: color-mix(in oklch, var(--color-primary) 72%, black);
  }

  .list-item.completed {
    opacity: 0.72;
  }

  .list-item.completed :global(.goal-card) {
    border-style: dashed;
  }

  .list-item.completed :global(.goal-title) {
    text-decoration: line-through;
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

  .progress-items {
    display: grid;
    gap: 0.45rem;
  }

  .progress-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .progress-item .done {
    text-decoration: line-through;
    color: var(--color-text-muted);
  }
</style>
