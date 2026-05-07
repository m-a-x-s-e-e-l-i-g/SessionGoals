<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';
  import { addActivity } from '$lib/data/activities';
  import { getMyGoals } from '$lib/data/goals';
  import { ACTIVITY_TYPES, type Activity } from '$lib/types';
  import { formatActivityType } from '$lib/utils/format';

  const dispatch = createEventDispatcher<{ logged: { activity: Activity } }>();

  const today = new Date().toISOString().split('T')[0];
  const activityTypes = ACTIVITY_TYPES.map((value) => ({
    value,
    label: formatActivityType(value),
  }));

  let activityType: Activity['activityType'] = 'parkour';
  let duration = '';
  let activityDate = today;
  let notes = '';
  let linkedGoalId = '';
  let formError = '';
  let successMessage = '';
  let isSubmitting = false;

  $: activeGoals = getMyGoals().filter((g) => g.status !== 'done');

  const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

  function formatLoggedDate(date: string) {
    return dateFormatter.format(new Date(date + 'T00:00:00Z'));
  }

  function validateForm(): string | null {
    if (!activityDate) {
      return 'Choose the day you trained.';
    }

    if (activityDate > today) {
      return 'Training dates cannot be in the future.';
    }

    if (duration) {
      const parsedDuration = Number.parseInt(duration, 10);
      if (Number.isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 480) {
        return 'Duration must be between 1 and 480 minutes.';
      }
    }

    return null;
  }

  async function handleLog() {
    if (isSubmitting) return;

    formError = '';
    successMessage = '';

    const validationError = validateForm();
    if (validationError) {
      formError = validationError;
      return;
    }

    isSubmitting = true;

    try {
      await Promise.resolve();

      const currentUserId = $page.data.user?.id;
      if (!currentUserId) {
        throw new Error('Sign in to log activity.');
      }

      const activity = await addActivity({
        userId: currentUserId,
        date: activityDate,
        activityType,
        duration: duration ? Number.parseInt(duration, 10) : undefined,
        notes: notes.trim() || undefined,
        linkedGoalId: linkedGoalId || undefined,
      });

      successMessage =
        activityDate === today
          ? 'Session logged. Your streak and heatmap are up to date.'
          : `Session added for ${formatLoggedDate(activityDate)}.`;

      activityType = 'parkour';
      duration = '';
      notes = '';
      linkedGoalId = '';
      activityDate = today;

      dispatch('logged', { activity });
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Could not log the session. Try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="activity-form-card card">
  <div class="form-header">
    <div>
      <p class="form-eyebrow">Quick log</p>
      <h3 class="form-title">Capture the session while it still feels fresh</h3>
    </div>
    {#if successMessage}
      <span class="success-badge">Ready</span>
    {/if}
  </div>

  <p class="form-subtitle text-muted text-sm">
    Log parkour or support work like running, gym, bouldering, and calisthenics. Any training type keeps the streak alive.
  </p>

  {#if successMessage}
    <p class="form-status form-status-success" role="status">{successMessage}</p>
  {/if}

  {#if formError}
    <p class="form-status form-status-error" role="alert">{formError}</p>
  {/if}

  <div class="form-row">
    <div class="form-group">
      <label for="activityType">Training Type</label>
      <select id="activityType" bind:value={activityType} disabled={isSubmitting}>
        {#each activityTypes as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <div class="form-group">
      <label for="activityDate">Session Date</label>
      <input id="activityDate" type="date" bind:value={activityDate} max={today} disabled={isSubmitting} />
    </div>

    <div class="form-group">
      <label for="duration">Duration (minutes)</label>
      <input
        id="duration"
        type="number"
        bind:value={duration}
        min="1"
        max="480"
        placeholder="30"
        disabled={isSubmitting}
      />
    </div>

    <div class="form-group">
      <label for="linkedGoal">Goal Focus</label>
      <select id="linkedGoal" bind:value={linkedGoalId} disabled={isSubmitting}>
        <option value="">None</option>
        {#each activeGoals as goal}
          <option value={goal.id}>{goal.title}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="form-group">
    <label for="notes">Notes</label>
    <textarea
      id="notes"
      bind:value={notes}
      placeholder="How did it feel? What should you chase next time?"
      rows="3"
      disabled={isSubmitting}
    ></textarea>
  </div>

  <button
    class="btn btn-primary form-submit"
    on:click={handleLog}
    disabled={isSubmitting}
    aria-busy={isSubmitting}
  >
    {isSubmitting ? 'Logging session…' : 'Log Session'}
  </button>
</div>

<style>
  .activity-form-card {
    margin-bottom: 2rem;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .form-eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-accent);
    margin-bottom: 0.35rem;
  }

  .form-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
  }

  .success-badge {
    display: inline-flex;
    align-items: center;
    background: color-mix(in oklch, var(--color-success) 18%, var(--color-surface));
    color: var(--color-success);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.45rem 0.8rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklch, var(--color-success) 35%, var(--color-border));
  }

  .form-subtitle {
    max-width: 52ch;
    margin-bottom: 1rem;
  }

  .form-status {
    border-radius: var(--radius-sm);
    padding: 0.75rem 0.9rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .form-status-success {
    background: color-mix(in oklch, var(--color-success) 12%, var(--color-surface));
    color: color-mix(in oklch, var(--color-success) 72%, var(--color-text));
    border: 1px solid color-mix(in oklch, var(--color-success) 30%, var(--color-border));
  }

  .form-status-error {
    background: color-mix(in oklch, var(--color-danger) 10%, var(--color-surface));
    color: color-mix(in oklch, var(--color-danger) 72%, var(--color-text));
    border: 1px solid color-mix(in oklch, var(--color-danger) 30%, var(--color-border));
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  @media (min-width: 960px) {
    .form-row {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 0;
  }

  .form-group label {
    white-space: nowrap;
    min-height: 1.2rem;
  }

  input,
  select,
  textarea {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    font-family: inherit;
    font-size: 0.95rem;
    padding: 0.65rem 0.9rem;
    width: 100%;
    min-height: 44px;
    transition: border-color 0.15s;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 18%, transparent);
  }

  textarea {
    resize: vertical;
    min-height: 90px;
  }

  .form-submit {
    width: 100%;
    margin-top: 1rem;
  }

  .form-submit[disabled] {
    opacity: 0.7;
    cursor: wait;
  }

  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }

    .form-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
