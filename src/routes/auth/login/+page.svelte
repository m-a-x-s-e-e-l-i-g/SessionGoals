<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  const callbackErrorMessages: Record<string, string> = {
    oauth_callback: 'Google sign-in did not return a valid callback. Please try again.',
    oauth_exchange: 'Google sign-in succeeded, but session creation failed. Please try again.'
  };

  $: callbackError = callbackErrorMessages[data?.urlError ?? ''] ?? null;
  let isLoading = false;
</script>

<svelte:head>
  <title>Sign in — SessionGoals</title>
</svelte:head>

<div class="container page auth-page">
  <section class="auth-card card">
    <img src="/images/sessiongoals-logo.svg" class="auth-logo" alt="SessionGoals" width="64" height="64" />
    <h1 class="auth-title">Sign in to track your training.</h1>
    <p class="auth-copy">
      This app is for logged-in athletes only. Continue with Google to create goals, track lists, and log sessions.
    </p>

    {#if data.missingConfig}
      <p class="auth-error">
        Supabase auth is not configured. Set <code>PUBLIC_SUPABASE_URL</code> and <code>PUBLIC_SUPABASE_ANON_KEY</code>.
      </p>
    {/if}

    {#if callbackError}
      <p class="auth-error">{callbackError}</p>
    {/if}

    <form method="POST" on:submit={() => (isLoading = true)}>
      <input type="hidden" name="next" value={data.next} />
      <button type="submit" class="btn btn-primary auth-button" disabled={isLoading} aria-busy={isLoading}>
        {isLoading ? 'Loading…' : 'Continue with Google'}
      </button>
    </form>

    <p class="auth-legal text-sm text-muted">
      By signing in, you agree to our <a href="/terms">Terms of Use</a> and <a href="/privacy">Privacy Policy</a>.
    </p>
  </section>
</div>

<style>
  .auth-page {
    min-height: calc(100vh - 60px);
    display: grid;
    place-items: center;
    padding-top: 3rem;
    padding-bottom: 3rem;
  }

  .auth-card {
    width: min(540px, 100%);
    padding: 2rem;
    display: grid;
    gap: 1rem;
  }

  .auth-logo {
    display: block;
    border-radius: var(--radius-md);
  }

  .auth-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 2.9rem);
    line-height: 1;
  }

  .auth-copy {
    color: var(--color-text-muted);
    max-width: 48ch;
  }

  .auth-button {
    width: 100%;
    font-size: 1rem;
    padding: 0.85rem 1rem;
  }

  .auth-error {
    color: var(--color-danger);
    background: color-mix(in oklch, var(--color-danger) 10%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-danger) 35%, var(--color-border));
    border-radius: var(--radius-sm);
    padding: 0.75rem 0.9rem;
    line-height: 1.5;
  }

  .auth-legal a {
    font-weight: 600;
  }
</style>
