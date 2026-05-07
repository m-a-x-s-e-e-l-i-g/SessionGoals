<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import GoalForm from '$lib/components/GoalForm.svelte';
  import { getGoalById, updateGoal } from '$lib/data/goals';
  import { getListById } from '$lib/data/lists';
  import { getSpotById, upsertSpot } from '$lib/data/spots';
  import { getTags } from '$lib/data/tags';
  import type { GoalStatus, GoalType, Spot, UpdateGoalInput } from '$lib/types';

  const tags = getTags();
  let submitting = false;
  let error: string | undefined;

  $: goalId = $page.params.goalId ?? '';
  $: goal = goalId ? getGoalById(goalId) : undefined;
  $: listId = $page.url.searchParams.get('listId') ?? undefined;
  $: sourceList = listId ? getListById(listId) : undefined;
  $: initialSpot = goal?.spotId ? (getSpotById(goal.spotId) ?? null) : null;

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!goalId || !goal) return;

    submitting = true;
    error = undefined;

    const form = event.target as HTMLFormElement;
    const data = new FormData(form);

    const title = (data.get('title') as string)?.trim();
    if (!title) {
      error = 'Title is required.';
      submitting = false;
      return;
    }

    const input: UpdateGoalInput = {
      type: (data.get('type') as GoalType) ?? 'move',
      title,
      description: (data.get('description') as string)?.trim() || undefined,
      status: (data.get('status') as GoalStatus) ?? 'want_to_try',
      difficulty: data.get('difficulty') ? Number(data.get('difficulty')) : undefined,
      spotId: (data.get('spotId') as string)?.trim() || undefined,
      sourceUrl: (data.get('sourceUrl') as string)?.trim() || undefined,
      tagIds: data.getAll('tags') as string[],
    };

    const spotPayload = (data.get('spotPayload') as string)?.trim();

    try {
      if (spotPayload) {
        const spot = JSON.parse(spotPayload) as Spot;
        await upsertSpot(spot);
      }

      const updatedGoal = await updateGoal(goalId, input);
      goto(`/goals/${updatedGoal.id}`);
    } catch {
      error = 'Failed to update goal. Please try again.';
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>{goal ? `Edit ${goal.title}` : 'Edit Goal'} — SessionGoals</title>
</svelte:head>

<div class="container page">
  {#if !goal}
    <div class="not-found">
      <h2>Goal not found</h2>
      <a href="/goals" class="btn btn-ghost">← Back to Goals</a>
    </div>
  {:else}
    <div class="page-header">
      <div>
        {#if sourceList}
          <a href="/lists/{sourceList.id}" class="back-link text-muted text-sm">← {sourceList.name}</a>
        {:else}
          <a href="/goals/{goal.id}" class="back-link text-muted text-sm">← Goal</a>
        {/if}
        <h1 class="page-title">Edit Goal</h1>
      </div>
    </div>

    <div class="form-card card">
      <form on:submit={handleSubmit}>
        <GoalForm
          {tags}
          {submitting}
          {error}
          submitLabel="Update Goal"
          cancelHref={`/goals/${goal.id}`}
          initial={{
            type: goal.type,
            title: goal.title,
            description: goal.description,
            status: goal.status,
            difficulty: goal.difficulty,
            sourceUrl: goal.sourceUrl,
          }}
          initialTagIds={goal.tags.map((tag) => tag.id)}
          {initialSpot}
        />
      </form>
    </div>
  {/if}
</div>

<style>
  .form-card {
    max-width: 680px;
  }

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
    text-decoration: none;
  }

  .back-link:hover {
    text-decoration: underline;
  }
</style>
