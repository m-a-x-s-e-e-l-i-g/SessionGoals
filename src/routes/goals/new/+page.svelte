<script lang="ts">
  import { goto } from '$app/navigation';
  import { getTags } from '$lib/data/tags';
  import { createGoal } from '$lib/data/goals';
  import { upsertSpot } from '$lib/data/spots';
  import GoalForm from '$lib/components/GoalForm.svelte';
  import type { CreateGoalInput, GoalType, GoalStatus, Spot } from '$lib/types';

  const tags = getTags();
  let submitting = false;
  let error: string | undefined;

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
      goto(`/goals/${goal.id}`);
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
    <h1 class="page-title">New Goal</h1>
  </div>

  <div class="form-card card">
    <form on:submit={handleSubmit}>
      <GoalForm {tags} {submitting} {error} />
    </form>
  </div>
</div>

<style>
  .form-card {
    max-width: 680px;
  }
</style>
