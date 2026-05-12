<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import {
    getUserById,
    getTeacherForStudent,
    getStudentsForTeacher,
    getStudentTrackingSummary,
    updateUserProfile,
    deleteAccount,
    isTeacher,
  } from '$lib/data/users';
  import { createGoal, getGoals } from '$lib/data/goals';
  import { getLists } from '$lib/data/lists';
  import { getActivities, getActivityStats, getRecentActivities } from '$lib/data/activities';
  import ListCard from '$lib/components/ListCard.svelte';
  import ActivityHeatmap from '$lib/components/ActivityHeatmap.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import type { CreateGoalInput, Goal, GoalStatus, UserProfile } from '$lib/types';
  import {
    CHECKED_ICON,
    formatActivityType,
    formatGoalStatsSummary,
    formatGoalType,
    pluralize,
    typeIcon,
  } from '$lib/utils/format';

  $: isAuthenticated = !!$page.data.user;
  $: currentUserId = $page.data.user?.id;
  $: allGoals = getGoals();
  $: goalById = new Map(allGoals.map((g) => [g.id, g]));

  // Follow sourceGoalId chain to the root goal, with cycle guard
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

  // Root IDs of every goal the current user owns — covers both originals and tracked copies.
  // If any root of a viewed goal matches here, the user already has that move in some form.
  $: myGoalRootIds = new Set(
    allGoals
      .filter((g) => g.userId === currentUserId)
      .map((g) => resolveRootGoalId(g.id))
  );
  $: userId = $page.params.userId ?? '';
  $: profile = userId ? getUserById(userId) : undefined;
  $: isOwnProfile = isAuthenticated && !!currentUserId && userId === currentUserId;
  $: profileTeacher = userId ? getTeacherForStudent(userId) : undefined;
  $: teacherStudents = userId ? getStudentsForTeacher(userId) : [];
  $: teacherViewEnabled = !!profile && isTeacher(profile) && (isOwnProfile || profile.isPublic);

  // ── Edit mode ──────────────────────────────────────────────────────────────
  let editing = false;
  let addingGoalId: string | null = null;
  let goalsFeedback: string | undefined;
  let editDisplayName = '';
  let editBio = '';
  let editCity = '';
  let editCountry = '';
  let editIsPublic = true;
  let editRole: UserProfile['role'] = 'athlete';
  let showDeleteAccountDialog = false;
  let deletingAccount = false;
  const addingGoalMessage = 'Adding…';

  function startEdit() {
    if (!profile) return;
    editDisplayName = profile.displayName;
    editBio = profile.bio ?? '';
    editCity = profile.city ?? '';
    editCountry = profile.country ?? '';
    editIsPublic = profile.isPublic;
    editRole = profile.role;
    editing = true;
  }

  function cancelEdit() {
    editing = false;
  }

  async function saveEdit() {
    if (!userId) return;
    await updateUserProfile(userId, {
      displayName: editDisplayName.trim() || profile?.displayName,
      bio: editBio.trim() || undefined,
      city: editCity.trim() || undefined,
      country: editCountry.trim() || undefined,
      isPublic: editIsPublic,
      role: editRole,
    });
    // re-read updated profile
    profile = getUserById(userId);
    editing = false;
  }

  async function confirmDeleteAccount() {
    if (!userId || deletingAccount) return;
    deletingAccount = true;
    try {
      await deleteAccount(userId);
      await goto('/auth/login');
    } catch {
      deletingAccount = false;
      showDeleteAccountDialog = false;
    }
  }

  $: visibleGoals = getGoals().filter((g) => {
    if (g.userId !== userId) return false;
    return isOwnProfile || profile?.isPublic;
  });
  $: activeGoals = visibleGoals.filter((goal) => goal.status !== 'done');
  $: checkedGoals = visibleGoals.filter((goal) => goal.status === 'done');
  $: activeMoveGoals = activeGoals.filter((goal) => goal.type === 'move');
  $: activeSpotGoals = activeGoals.filter((goal) => goal.type === 'spot');
  $: checkedMoveGoals = checkedGoals.filter((goal) => goal.type === 'move');
  $: checkedSpotGoals = checkedGoals.filter((goal) => goal.type === 'spot');

  $: visibleLists = getLists().filter((l) => {
    if (l.userId !== userId) return false;
    return isOwnProfile || l.visibility === 'public';
  });

  $: activityStats = getActivityStats(7, userId || undefined);
  $: recentActivities = getRecentActivities(10, userId || undefined);
  $: allActivities = getActivities();

  function getStreakMessage(streak: number) {
    if (streak >= 30) return 'This athlete is on a serious run.';
    if (streak >= 14) return 'Two steady weeks in a row.';
    if (streak >= 7) return 'A full week of momentum.';
    if (streak >= 3) return 'Rhythm is building.';
    if (streak >= 1) return 'Fresh streak on the board.';
    return 'No sessions logged in the streak window yet.';
  }

  function formatActivityDate(date: string) {
    return new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function toGoalCopyInput(goal: Goal, status: GoalStatus): CreateGoalInput {
    return {
      type: goal.type,
      sourceGoalId: goal.id,
      title: goal.title,
      status,
    };
  }

  async function addGoalToMine(goal: Goal, status: GoalStatus) {
    if (!isAuthenticated || !currentUserId) return;
    if (goal.userId && goal.userId === currentUserId) return;
    if (myGoalRootIds.has(resolveRootGoalId(goal.id))) {
      goalsFeedback = `"${goal.title}" is already in your goals.`;
      return;
    }
    if (addingGoalId) return;

    addingGoalId = goal.id;
    goalsFeedback = undefined;

    try {
      await createGoal(toGoalCopyInput(goal, status));
      goalsFeedback = status === 'done'
        ? `Checked off \"${goal.title}\" in your collection.`
        : `Added \"${goal.title}\" to your goals.`;
    } catch {
      goalsFeedback = 'Could not add this goal right now. Please try again.';
    } finally {
      addingGoalId = null;
    }
  }

  async function trackGoalInMine(goal: Goal) {
    await addGoalToMine(goal, 'want_to_try');
  }

  async function checkOffGoalInMine(goal: Goal) {
    await addGoalToMine(goal, 'done');
  }
</script>

<svelte:head>
  <title>{profile?.displayName ?? 'Profile'} — SessionGoals</title>
</svelte:head>

<div class="container page">
  {#if !profile}
    <div class="not-found">
      <h2>Profile not found</h2>
      <a href="/people" class="btn btn-ghost">← Back to People</a>
    </div>
  {:else if !profile.isPublic && !isOwnProfile}
    <div class="not-found">
      <h2>This profile is private</h2>
      <a href="/people" class="btn btn-ghost">← Back to People</a>
    </div>
  {:else}
    <div class="profile-hero card">
      <div class="profile-header">
        <div>
          <a href="/people" class="back-link text-muted text-sm">← People</a>
          <div class="profile-name-row">
            <h1 class="page-title">{profile.displayName}</h1>
            {#if profile.isAdmin}
              <span class="admin-badge">Admin</span>
            {/if}
          </div>
          <p class="text-muted text-sm">@{profile.username}</p>
          <p class="text-muted text-sm role-line">
            Role: {profile.role === 'athlete_teacher' ? 'Athlete + Teacher' : profile.role === 'teacher' ? 'Teacher' : 'Athlete'}
          </p>
          {#if profile.teacherId && profileTeacher}
            <p class="text-muted text-sm">Coach: <a href="/people/{profileTeacher.id}">{profileTeacher.displayName}</a></p>
          {/if}
        </div>
        {#if isOwnProfile}
          <div class="own-profile-actions">
            <span class="badge">Your Profile</span>
            {#if !editing}
              <button class="btn btn-ghost btn-sm" on:click={startEdit}>Edit Profile</button>
            {/if}
          </div>
        {/if}
      </div>

      {#if isOwnProfile && editing}
        <form class="edit-form" on:submit|preventDefault={saveEdit}>
          <div class="form-row">
            <label class="form-label" for="edit-displayname">Display name</label>
            <input
              id="edit-displayname"
              class="form-input"
              type="text"
              bind:value={editDisplayName}
              required
              maxlength="60"
            />
          </div>
          <div class="form-row">
            <label class="form-label" for="edit-bio">Bio</label>
            <textarea
              id="edit-bio"
              class="form-input form-textarea"
              bind:value={editBio}
              rows="3"
              maxlength="300"
            ></textarea>
          </div>
          <div class="form-row-group">
            <div class="form-row">
              <label class="form-label" for="edit-city">City</label>
              <input id="edit-city" class="form-input" type="text" bind:value={editCity} maxlength="60" />
            </div>
            <div class="form-row">
              <label class="form-label" for="edit-country">Country</label>
              <input id="edit-country" class="form-input" type="text" bind:value={editCountry} maxlength="60" />
            </div>
          </div>
          <div class="form-row">
            <label class="form-label" for="edit-role">Role</label>
            <select id="edit-role" class="form-input form-select" bind:value={editRole}>
              <option value="athlete">Athlete</option>
              <option value="teacher">Teacher</option>
              <option value="athlete_teacher">Athlete + Teacher</option>
            </select>
          </div>
          <div class="form-row form-row-check">
            <input id="edit-public" type="checkbox" bind:checked={editIsPublic} />
            <label for="edit-public" class="form-label-inline">Public profile</label>
          </div>
          <div class="edit-actions">
            <button type="submit" class="btn btn-primary btn-sm">Save</button>
            <button type="button" class="btn btn-ghost btn-sm" on:click={cancelEdit}>Cancel</button>
          </div>
          <div class="delete-account-section">
            <button
              type="button"
              class="btn btn-danger btn-sm"
              on:click={() => (showDeleteAccountDialog = true)}
            >
              Delete account
            </button>
          </div>
        </form>

        <ConfirmDialog
          bind:isOpen={showDeleteAccountDialog}
          title="Delete account"
          message="This will permanently delete your account and all your data. This action cannot be undone."
          confirmLabel="Delete my account"
          isDangerous={true}
          isLoading={deletingAccount}
          on:confirm={confirmDeleteAccount}
        />
      {:else}
        {#if profile.bio}
          <p class="profile-bio">{profile.bio}</p>
        {/if}
        <div class="profile-meta text-muted text-sm">
          {#if profile.city || profile.country}
            <span>{profile.city}{profile.city && profile.country ? ', ' : ''}{profile.country}</span>
          {/if}
          <span>Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
        </div>
        <div class="profile-quick-stats">
          <a
            href="#profile-spots-todo"
            class="quick-stat quick-stat--spot"
            aria-label={`Spot Todos: ${activeSpotGoals.length}`}
          >
            <span class="quick-stat-icon">📍</span>
            <span class="quick-stat-body">
              <span class="quick-stat-value">{activeSpotGoals.length}</span>
              <span class="quick-stat-label">Spot Todos</span>
            </span>
          </a>
          <a
            href="#profile-moves-todo"
            class="quick-stat quick-stat--move"
            aria-label={`Move Todos: ${activeMoveGoals.length}`}
          >
            <span class="quick-stat-icon">🤸</span>
            <span class="quick-stat-body">
              <span class="quick-stat-value">{activeMoveGoals.length}</span>
              <span class="quick-stat-label">Move Todos</span>
            </span>
          </a>
          <a
            href="#checked-goals"
            class="quick-stat quick-stat--done"
            aria-label={`Moves Done: ${checkedMoveGoals.length}`}
          >
            <span class="quick-stat-icon">{CHECKED_ICON}</span>
            <span class="quick-stat-body">
              <span class="quick-stat-value">{checkedMoveGoals.length}</span>
              <span class="quick-stat-label">Moves Done</span>
            </span>
          </a>
          <a href="#lists" class="quick-stat">
            <span class="quick-stat-value">{visibleLists.length}</span>
            <span class="quick-stat-label">{pluralize(visibleLists.length, 'list')}</span>
          </a>
          {#if activityStats.streak > 0}
            <a href="#activity" class="quick-stat">
              <span class="quick-stat-value">{activityStats.streak}</span>
              <span class="quick-stat-label">day streak</span>
            </a>
          {/if}
        </div>
      {/if}
    </div>

    <section class="section-block" id="activity">
      <div class="section-header">
        <div>
          <p class="activity-eyebrow">Activity</p>
          <h2 class="section-title">Training rhythm</h2>
        </div>
      </div>
      <div class="activity-section card">
        <div class="activity-summary">
          <div class="activity-summary-hero">
            <div class="stat-box stat-box-hero">
              <div class="stat-value stat-value-hero">{activityStats.streak}</div>
              <div>
                <div class="stat-label">Day streak</div>
                <p class="activity-story">{getStreakMessage(activityStats.streak)}</p>
              </div>
            </div>
          </div>

          <div class="activity-stats">
            <div class="stat-box">
              <div class="stat-value">{activityStats.activeDays}</div>
              <div class="stat-label">Sessions in 7 days</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{activityStats.totalDuration}</div>
              <div class="stat-label">Minutes this week</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{activityStats.averageDuration}</div>
              <div class="stat-label">Average session</div>
            </div>
          </div>
        </div>

        <div class="activity-heatmap-container">
          <ActivityHeatmap activities={allActivities} userId={userId} />
        </div>

        <div class="activity-recent">
          <div class="activity-recent-header">
            <h3 class="activity-recent-title">Recent sessions</h3>
            <p class="text-muted text-sm">Short notes keep the next session from starting blind.</p>
          </div>

          {#if recentActivities.length === 0}
            <p class="text-muted">No activity logged yet.</p>
          {:else}
            <ul class="activity-list">
              {#each recentActivities as activity}
                <li class="activity-item text-sm">
                  <div class="activity-item-date">
                    <span class="activity-date">{formatActivityDate(activity.date)}</span>
                    <span class="activity-date-meta">{formatActivityType(activity.activityType)} session</span>
                  </div>
                  <div class="activity-item-body">
                    <div class="activity-item-meta">
                      <span class="activity-duration activity-type-badge">{formatActivityType(activity.activityType)}</span>
                      {#if activity.duration}
                        <span class="activity-duration">{activity.duration} min</span>
                      {/if}
                    </div>
                    {#if activity.notes}
                      <span class="activity-notes">{activity.notes}</span>
                    {:else}
                      <span class="activity-notes activity-notes-empty">No notes logged for this session.</span>
                    {/if}
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </section>

    {#if teacherViewEnabled}
      <section class="section-block">
        <div class="section-header">
          <h2 class="section-title">Students</h2>
        </div>
        {#if teacherStudents.length === 0}
          <p class="text-muted">No students assigned yet.</p>
        {:else}
          <div class="student-grid">
            {#each teacherStudents as student}
              {@const summary = getStudentTrackingSummary(student.id)}
              <article class="student-card card">
                <div class="student-head">
                  <h3 class="student-name"><a href="/people/{student.id}">{student.displayName}</a></h3>
                  <span class="text-muted text-sm">@{student.username}</span>
                </div>
                <div class="student-metrics">
                  <span class="badge">Goals {summary.goalsDone}/{summary.goalsTotal}</span>
                  <span class="badge">Tracked {summary.trackedDone}/{summary.trackedTotal}</span>
                </div>
                <div>
                  <p class="text-muted text-sm needs-label">Needs</p>
                  {#if summary.needs.length === 0}
                    <p class="text-muted text-sm">No coaching needs listed.</p>
                  {:else}
                    <ul class="needs-list text-sm">
                      {#each summary.needs as need}
                        <li>{need}</li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              </article>
            {/each}
          </div>
        {/if}
      </section>
    {/if}

    <div class="goals-lists-wrapper">
      <section class="section-block section-goals" id="goals">
        <div class="section-header">
          <div>
            <h2 class="section-title">Goals</h2>
            <p class="section-subtitle text-muted text-sm">
              {formatGoalStatsSummary(activeSpotGoals.length, activeMoveGoals.length, checkedMoveGoals.length)}
            </p>
          </div>
        </div>
        {#if goalsFeedback}
          <p class="goals-feedback text-sm">{goalsFeedback}</p>
        {/if}
        {#if visibleGoals.length === 0}
          <EmptyState
            icon="🎯"
            title="No goals yet"
            message="No visible goals on this profile right now."
          />
        {:else}
          {#if activeGoals.length > 0}
            {#if activeSpotGoals.length > 0}
              <div class="goal-subsection" id="profile-spots-todo">
                <div class="goal-subsection-head">
                  <h3 class="goal-subsection-title">📍 Spot Todos</h3>
                  <span class="goal-subsection-badge">{activeSpotGoals.length} to do</span>
                </div>
                <div class="tiny-goal-grid">
                  {#each activeSpotGoals as goal}
                    {@const canAddToMine = isAuthenticated && goal.userId !== currentUserId && !myGoalRootIds.has(resolveRootGoalId(goal.id))}
                    <article class="tiny-goal-card tiny-goal-card--spot">
                      <a href="/goals/{goal.id}" class="tiny-goal-title">{goal.title}</a>
                      <span class="tiny-goal-meta">{typeIcon(goal.type)} {formatGoalType(goal.type)}</span>
                      {#if canAddToMine}
                        <div class="tiny-goal-actions">
                          <button
                            type="button"
                            class="tiny-goal-action"
                            aria-label="Track {goal.title}"
                            on:click={() => trackGoalInMine(goal)}
                          >
                            Track
                          </button>
                          <button
                            type="button"
                            class="tiny-goal-action tiny-goal-action--done"
                            aria-label="Add {goal.title} as checked off"
                            on:click={() => checkOffGoalInMine(goal)}
                          >
                            {CHECKED_ICON}
                          </button>
                        </div>
                      {/if}
                      {#if addingGoalId === goal.id}
                        <span class="tiny-goal-loading text-muted">{addingGoalMessage}</span>
                      {/if}
                    </article>
                  {/each}
                </div>
              </div>
            {/if}

            {#if activeMoveGoals.length > 0}
              <div class="goal-subsection" id="profile-moves-todo">
                <div class="goal-subsection-head">
                  <h3 class="goal-subsection-title">🤸 Move Todos</h3>
                  <span class="goal-subsection-badge">{activeMoveGoals.length} to do</span>
                </div>
                <div class="tiny-goal-grid">
                  {#each activeMoveGoals as goal}
                    {@const canAddToMine = isAuthenticated && goal.userId !== currentUserId && !myGoalRootIds.has(resolveRootGoalId(goal.id))}
                    <article class="tiny-goal-card tiny-goal-card--move">
                      <a href="/goals/{goal.id}" class="tiny-goal-title">{goal.title}</a>
                      <span class="tiny-goal-meta">{typeIcon(goal.type)} {formatGoalType(goal.type)}</span>
                      {#if canAddToMine}
                        <div class="tiny-goal-actions">
                          <button
                            type="button"
                            class="tiny-goal-action"
                            aria-label="Track {goal.title}"
                            on:click={() => trackGoalInMine(goal)}
                          >
                            Track
                          </button>
                          <button
                            type="button"
                            class="tiny-goal-action tiny-goal-action--done"
                            aria-label="Add {goal.title} as checked off"
                            on:click={() => checkOffGoalInMine(goal)}
                          >
                            {CHECKED_ICON}
                          </button>
                        </div>
                      {/if}
                      {#if addingGoalId === goal.id}
                        <span class="tiny-goal-loading text-muted">{addingGoalMessage}</span>
                      {/if}
                    </article>
                  {/each}
                </div>
              </div>
            {/if}
          {:else}
            <p class="text-muted">No active goals right now.</p>
          {/if}

          {#if checkedGoals.length > 0}
            <details
              class="checked-collection"
              id="checked-goals"
              open={activeGoals.length === 0}
              aria-label="Checked-off goals collection"
            >
              <summary>
                <span>Achievements</span>
                <span class="checked-count">
                  {checkedMoveGoals.length} {pluralize(checkedMoveGoals.length, 'move')}
                  {#if checkedSpotGoals.length > 0}
                    · {checkedSpotGoals.length} {pluralize(checkedSpotGoals.length, 'spot')}
                  {/if}
                </span>
              </summary>
              {#if checkedMoveGoals.length > 0}
                <div class="checked-group">
                  <h3 class="checked-group-title">🤸 Moves Mastered</h3>
                  <div class="checked-grid">
                    {#each checkedMoveGoals as goal}
                      {@const canAddToMine = isAuthenticated && goal.userId !== currentUserId && !myGoalRootIds.has(resolveRootGoalId(goal.id))}
                      <article class="checked-chip checked-chip--move">
                        <a href="/goals/{goal.id}" class="checked-title">{goal.title}</a>
                        <span class="checked-type text-muted">{typeIcon(goal.type)} {formatGoalType(goal.type)}</span>
                        {#if canAddToMine}
                          <button
                            type="button"
                            class="checked-add"
                            on:click={() => checkOffGoalInMine(goal)}
                          >
                            {CHECKED_ICON} Add checked
                          </button>
                        {/if}
                        {#if addingGoalId === goal.id}
                          <span class="text-sm text-muted">{addingGoalMessage}</span>
                        {/if}
                      </article>
                    {/each}
                  </div>
                </div>
              {/if}
              {#if checkedSpotGoals.length > 0}
                <div class="checked-group">
                  <h3 class="checked-group-title">📍 Spots Completed</h3>
                  <div class="checked-grid">
                    {#each checkedSpotGoals as goal}
                      {@const canAddToMine = isAuthenticated && goal.userId !== currentUserId && !myGoalRootIds.has(resolveRootGoalId(goal.id))}
                      <article class="checked-chip checked-chip--spot">
                        <a href="/goals/{goal.id}" class="checked-title">{goal.title}</a>
                        <span class="checked-type text-muted">{typeIcon(goal.type)} {formatGoalType(goal.type)}</span>
                        {#if canAddToMine}
                          <button
                            type="button"
                            class="checked-add"
                            on:click={() => checkOffGoalInMine(goal)}
                          >
                            {CHECKED_ICON} Add checked
                          </button>
                        {/if}
                        {#if addingGoalId === goal.id}
                          <span class="text-sm text-muted">{addingGoalMessage}</span>
                        {/if}
                      </article>
                    {/each}
                  </div>
                </div>
              {/if}
            </details>
          {/if}
        {/if}
      </section>
 
      <section class="section-block section-lists" id="lists">
        <div class="section-header">
          <h2 class="section-title">Lists</h2>
        </div>
        {#if visibleLists.length === 0}
          <p class="text-muted">No visible lists yet.</p>
        {:else}
          <div class="grid-cards">
            {#each visibleLists as list}
              <ListCard {list} />
            {/each}
          </div>
        {/if}
      </section>
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
  }

  .profile-hero {
    margin-bottom: 1.5rem;
  }

  .profile-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.65rem;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 0.2rem;
  }

  .profile-name-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .admin-badge {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-surface);
    background: var(--color-primary);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    line-height: 1.4;
    flex-shrink: 0;
  }

  .profile-bio {
    line-height: 1.55;
    margin-bottom: 0.55rem;
  }

  .profile-meta {
    display: flex;
    gap: 0.9rem;
    flex-wrap: wrap;
  }

  .profile-quick-stats {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-top: 0.85rem;
  }

  .quick-stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.8rem;
    background:
      radial-gradient(circle at top left, color-mix(in oklch, var(--color-primary) 18%, transparent), transparent 62%),
      color-mix(in oklch, var(--color-primary) 8%, var(--color-surface));
    border: 1px solid color-mix(in oklch, var(--color-primary) 24%, var(--color-border));
    border-radius: var(--radius-md);
    text-decoration: none;
    color: var(--color-text);
    box-shadow: 0 8px 24px color-mix(in oklch, var(--color-primary) 10%, transparent);
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
  }

  .quick-stat:hover {
    background:
      radial-gradient(circle at top left, color-mix(in oklch, var(--color-primary) 24%, transparent), transparent 62%),
      color-mix(in oklch, var(--color-primary) 12%, var(--color-surface));
    border-color: color-mix(in oklch, var(--color-primary) 40%, var(--color-border));
    transform: translateY(-2px);
    text-decoration: none;
  }

  .quick-stat--spot {
    background:
      radial-gradient(circle at top left, color-mix(in oklch, var(--color-accent) 20%, transparent), transparent 62%),
      color-mix(in oklch, var(--color-accent) 8%, var(--color-surface));
    border-color: color-mix(in oklch, var(--color-accent) 26%, var(--color-border));
  }

  .quick-stat--done {
    background:
      radial-gradient(circle at top left, color-mix(in oklch, var(--color-success) 22%, transparent), transparent 62%),
      color-mix(in oklch, var(--color-success) 8%, var(--color-surface));
    border-color: color-mix(in oklch, var(--color-success) 28%, var(--color-border));
  }

  .quick-stat-icon {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    background: var(--color-surface-2);
    border: 1px solid color-mix(in oklch, var(--color-primary) 22%, var(--color-border));
    font-weight: 800;
    line-height: 1;
  }

  .quick-stat-body {
    display: grid;
    gap: 0.1rem;
  }

  .quick-stat-value {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--color-primary);
    line-height: 1;
  }

  .quick-stat-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: lowercase;
  }

  .goals-lists-wrapper {
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 768px) {
    .section-goals {
      order: 2;
    }
    .section-lists {
      order: 1;
    }
  }

  .role-line {
    margin-top: 0.2rem;
  }

  .section-block {
    margin-bottom: 2rem;
    scroll-margin-top: 72px;
  }

  .section-header {
    margin-bottom: 0.9rem;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 700;
  }

  .section-subtitle {
    margin-top: 0.25rem;
  }

  .goals-feedback {
    margin-bottom: 0.65rem;
    color: var(--color-success);
  }

  .goal-subsection {
    scroll-margin-top: 72px;
  }

  .goal-subsection + .goal-subsection {
    margin-top: 1.5rem;
  }

  .goal-subsection-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .goal-subsection-title,
  .checked-group-title {
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .goal-subsection-badge {
    border: 1px solid color-mix(in oklch, var(--color-primary) 28%, var(--color-border));
    border-radius: 999px;
    color: var(--color-primary);
    background: color-mix(in oklch, var(--color-primary) 10%, var(--color-surface));
    font-size: 0.74rem;
    font-weight: 800;
    padding: 0.18rem 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tiny-goal-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.45rem;
  }

  .tiny-goal-card {
    position: relative;
    display: grid;
    gap: 0.28rem;
    min-height: 5.2rem;
    padding: 0.6rem;
    background:
      radial-gradient(circle at top left, color-mix(in oklch, var(--color-primary) 14%, transparent), transparent 58%),
      color-mix(in oklch, var(--color-primary) 6%, var(--color-surface));
    border: 1px solid color-mix(in oklch, var(--color-primary) 20%, var(--color-border));
    border-radius: var(--radius-sm);
    box-shadow: 0 6px 18px color-mix(in oklch, var(--color-primary) 8%, transparent);
  }

  .tiny-goal-card--spot {
    background:
      radial-gradient(circle at top left, color-mix(in oklch, var(--color-accent) 16%, transparent), transparent 58%),
      color-mix(in oklch, var(--color-accent) 6%, var(--color-surface));
    border-color: color-mix(in oklch, var(--color-accent) 22%, var(--color-border));
  }

  .tiny-goal-card--move {
    background:
      radial-gradient(circle at top left, color-mix(in oklch, var(--color-primary) 15%, transparent), transparent 58%),
      color-mix(in oklch, var(--color-primary) 7%, var(--color-surface));
  }

  .tiny-goal-title {
    color: var(--color-text);
    font-size: 0.86rem;
    font-weight: 800;
    line-height: 1.15;
    text-decoration: none;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tiny-goal-title:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .tiny-goal-meta {
    width: fit-content;
    color: var(--color-text-muted);
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .tiny-goal-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    align-self: end;
    margin-top: 0.1rem;
  }

  .tiny-goal-action {
    border: 1px solid color-mix(in oklch, var(--color-primary) 30%, var(--color-border));
    border-radius: 999px;
    background: var(--color-surface);
    color: var(--color-primary);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.68rem;
    font-weight: 800;
    line-height: 1;
    padding: 0.3rem 0.45rem;
  }

  .tiny-goal-action--done {
    color: var(--color-success);
    border-color: color-mix(in oklch, var(--color-success) 38%, var(--color-border));
  }

  .tiny-goal-loading {
    font-size: 0.68rem;
  }

  @media (max-width: 480px) {
    .tiny-goal-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.4rem;
    }

    .tiny-goal-card {
      min-height: 4.8rem;
      padding: 0.5rem;
    }

    .tiny-goal-title {
      font-size: 0.8rem;
    }
  }

  .checked-collection {
    margin-top: 1rem;
    border-top: 1px solid var(--color-border);
    padding-top: 0.8rem;
    scroll-margin-top: 72px;
  }

  .checked-collection summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    list-style: none;
  }

  .checked-collection summary::-webkit-details-marker {
    display: none;
  }

  .checked-collection summary::after {
    content: '▾';
    margin-left: auto;
    color: var(--color-text-muted);
    transition: transform 0.15s;
  }

  .checked-collection:not([open]) summary::after {
    transform: rotate(-90deg);
  }

  .checked-count {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    color: var(--color-text-muted);
    font-family: var(--font-body);
    font-size: 0.75rem;
    padding: 0.1rem 0.5rem;
  }

  .checked-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 0.55rem;
    margin-top: 0.75rem;
  }

  .checked-group {
    margin-top: 0.85rem;
  }

  .checked-group + .checked-group {
    padding-top: 0.85rem;
    border-top: 1px dashed var(--color-border);
  }

  .checked-chip {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.25rem 0.6rem;
    padding: 0.55rem 0.7rem;
    background: color-mix(in oklch, var(--color-success) 8%, var(--color-surface));
    border: 1px solid color-mix(in oklch, var(--color-success) 22%, var(--color-border));
    border-radius: var(--radius-sm);
  }

  .checked-chip--spot {
    background: color-mix(in oklch, var(--color-accent) 8%, var(--color-surface));
    border-color: color-mix(in oklch, var(--color-accent) 22%, var(--color-border));
  }

  .checked-title {
    min-width: 0;
    color: var(--color-text);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-decoration: none;
  }

  .checked-title:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .checked-type {
    font-size: 0.76rem;
    white-space: nowrap;
  }

  .checked-add {
    grid-column: 1 / -1;
    justify-self: start;
    border: 1px solid color-mix(in oklch, var(--color-success) 42%, var(--color-border));
    background: var(--color-surface);
    color: var(--color-success);
    border-radius: 999px;
    padding: 0.25rem 0.6rem;
    font-family: inherit;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
  }

  .student-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 0.8rem;
  }

  .student-card {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .student-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.45rem;
  }

  .student-name {
    font-size: 1rem;
    font-weight: 700;
  }

  .student-name a {
    color: inherit;
    text-decoration: none;
  }

  .student-name a:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .student-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .needs-label {
    margin-bottom: 0.25rem;
    font-weight: 600;
  }

  .needs-list {
    margin: 0;
    padding-left: 1.1rem;
    color: var(--color-text);
  }

  /* ── Edit profile ─────────────────────────────────────────────────────────── */
  .own-profile-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-top: 0.65rem;
  }

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-row-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .form-row-check {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .form-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-muted, #888);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .form-label-inline {
    font-size: 0.9rem;
    font-weight: 500;
  }

  .form-input {
    background: var(--color-surface, #1a1a1a);
    border: 1px solid var(--color-border, #333);
    border-radius: var(--radius-sm, 6px);
    color: var(--color-text);
    font-family: inherit;
    font-size: 0.95rem;
    padding: 0.45rem 0.65rem;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-primary, #6366f1);
  }

  .form-textarea {
    resize: vertical;
    min-height: 72px;
  }

  .form-select {
    cursor: pointer;
  }

  .edit-actions {
    display: flex;
    gap: 0.55rem;
    margin-top: 0.25rem;
  }

  .delete-account-section {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }

  .btn-sm {
    padding: 0.3rem 0.8rem;
    font-size: 0.85rem;
  }

  /* ── Activity section ─────────────────────────────────────────────────────── */
  .activity-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    background:
      radial-gradient(circle at top left, color-mix(in oklch, var(--color-primary) 16%, transparent), transparent 48%),
      linear-gradient(180deg, color-mix(in oklch, var(--color-surface) 92%, var(--color-primary) 8%), var(--color-surface));
  }

  .activity-eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-accent);
    margin-bottom: 0.3rem;
  }

  .activity-summary {
    display: grid;
    grid-template-columns: minmax(260px, 1.2fr) minmax(0, 1fr);
    gap: 0.9rem;
  }

  .activity-summary-hero {
    min-width: 0;
  }

  .activity-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8rem;
  }

  .stat-box {
    padding: 0.9rem;
    background: color-mix(in oklch, var(--color-surface) 84%, var(--color-primary) 16%);
    border: 1px solid color-mix(in oklch, var(--color-primary) 18%, var(--color-border));
    border-radius: var(--radius-sm);
    min-width: 0;
  }

  .stat-box-hero {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: end;
    gap: 0.9rem;
    background: color-mix(in oklch, var(--color-surface) 72%, var(--color-primary) 28%);
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--color-primary);
    line-height: 0.92;
  }

  .stat-value-hero {
    font-size: clamp(3.6rem, 7vw, 5.4rem);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .activity-story {
    margin-top: 0.4rem;
    max-width: 28ch;
    color: color-mix(in oklch, var(--color-text) 76%, var(--color-primary));
    font-size: 0.92rem;
  }

  .activity-heatmap-container {
    overflow-x: auto;
    padding: 0.1rem;
  }

  .activity-recent {
    border-top: 1px solid var(--color-border);
    padding-top: 1rem;
  }

  .activity-recent-header {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .activity-recent-title {
    display: block;
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 600;
  }

  .activity-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .activity-item {
    display: grid;
    grid-template-columns: minmax(125px, 150px) 1fr;
    align-items: start;
    gap: 0.8rem;
    padding: 0.8rem 0;
    color: var(--color-text);
    border-top: 1px solid color-mix(in oklch, var(--color-border) 85%, transparent);
  }

  .activity-item:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .activity-item-date {
    display: grid;
    gap: 0.2rem;
  }

  .activity-date {
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-primary);
  }

  .activity-date-meta {
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .activity-item-body {
    display: grid;
    gap: 0.55rem;
  }

  .activity-item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .activity-duration {
    background: color-mix(in oklch, var(--color-primary) 12%, var(--color-surface));
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    color: color-mix(in oklch, var(--color-primary) 76%, var(--color-text));
    font-weight: 600;
    font-size: 0.75rem;
    border: 1px solid color-mix(in oklch, var(--color-primary) 24%, var(--color-border));
  }

  .activity-type-badge {
    background: color-mix(in oklch, var(--color-accent) 12%, var(--color-surface));
    color: var(--color-accent);
    border-color: color-mix(in oklch, var(--color-accent) 28%, var(--color-border));
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .activity-notes {
    color: var(--color-text);
    font-style: normal;
    max-width: 56ch;
  }

  .activity-notes-empty {
    color: var(--color-text-muted);
    font-style: italic;
  }

  @media (max-width: 900px) {
    .activity-summary {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .activity-stats,
    .activity-item {
      grid-template-columns: 1fr;
    }

    .activity-recent-header {
      align-items: start;
      flex-direction: column;
    }
  }
</style>
