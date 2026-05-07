<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getTags } from '$lib/data/tags';
  import { createGoal, getMyGoals } from '$lib/data/goals';
  import { addGoalToList, getListById } from '$lib/data/lists';
  import { upsertSpot } from '$lib/data/spots';
  import GoalForm from '$lib/components/GoalForm.svelte';
  import type { CreateGoalInput, GoalType, GoalStatus, Spot } from '$lib/types';

  const tags = getTags();
  let submitting = false;
  let error: string | undefined;
  const subgoalCandidates = getMyGoals().filter((goal) => goal.type === 'move');

  $: listId = $page.url.searchParams.get('listId') ?? undefined;
  $: sourceList = listId ? getListById(listId) : undefined;

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
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

    const input: CreateGoalInput = {
      type: (data.get('type') as GoalType) ?? 'move',
      title,
      description: (data.get('description') as string)?.trim() || undefined,
      status: (data.get('status') as GoalStatus) ?? 'want_to_try',
      difficulty: data.get('difficulty') ? Number(data.get('difficulty')) : undefined,
      spotId: (data.get('spotId') as string)?.trim() || undefined,
      subgoalIds: data.getAll('subgoalIds').map((value) => String(value)).filter(Boolean),
      sourceUrl: (data.get('sourceUrl') as string)?.trim() || undefined,
      tagIds: data.getAll('tags') as string[],
    };

    const spotPayload = (data.get('spotPayload') as string)?.trim();

    try {
      if (spotPayload) {
        const spot = JSON.parse(spotPayload) as Spot;
        await upsertSpot(spot);
      }

      const goal = await createGoal(input);

      if (listId) {
        await addGoalToList(listId, goal);
        goto(`/lists/${listId}`);
      } else {
        goto(`/goals/${goal.id}`);
      }
    } catch (e) {
      error = 'Failed to create goal. Please try again.';
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>New Goal — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <div>
      {#if sourceList}
        <a href="/lists/{sourceList.id}" class="back-link text-muted text-sm">← {sourceList.name}</a>
      {/if}
      <h1 class="page-title">New Goal</h1>
      {#if sourceList}
        <p class="text-muted text-sm">Will be added to <strong>{sourceList.name}</strong></p>
      {/if}
    </div>
  </div>

  <div class="form-card card">
    <form on:submit={handleSubmit}>
      <GoalForm {tags} {submitting} {error} availableSubgoals={subgoalCandidates} />
    </form>
  </div>
</div>

<style>
  .form-card {
    max-width: 680px;
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
