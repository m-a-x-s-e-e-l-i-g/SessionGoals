<script lang="ts">
  import { page } from '$app/stores';

  type ErrorAction = {
    href: string;
    label: string;
  };

  type ErrorPageContent = {
    eyebrow: string;
    title: string;
    message: string;
    primaryAction: ErrorAction;
    secondaryAction: ErrorAction;
  };

  const errorPages: Record<number, ErrorPageContent> = {
    400: {
      eyebrow: 'Bad request',
      title: 'That request needs a reset.',
      message: 'The page could not understand the request that was sent.',
      primaryAction: { href: '/', label: 'Go Home' },
      secondaryAction: { href: '/lists', label: 'Browse Lists' }
    },
    401: {
      eyebrow: 'Sign in required',
      title: 'Your session is missing.',
      message: 'Sign in again to continue tracking goals, lists, and sessions.',
      primaryAction: { href: '/auth/login', label: 'Sign In' },
      secondaryAction: { href: '/', label: 'Explore Public Pages' }
    },
    403: {
      eyebrow: 'Private page',
      title: 'This page is not open to you.',
      message: 'The owner may have kept this content private, or your account may not have access.',
      primaryAction: { href: '/', label: 'Go Home' },
      secondaryAction: { href: '/people', label: 'Find People' }
    },
    404: {
      eyebrow: 'Page not found',
      title: 'This route is not on the map.',
      message: 'The page may have moved, been deleted, or never existed.',
      primaryAction: { href: '/', label: 'Go Home' },
      secondaryAction: { href: '/spots', label: 'Explore Spots' }
    },
    500: {
      eyebrow: 'Server error',
      title: 'Something did not land cleanly.',
      message: 'The app hit an unexpected problem while loading this page.',
      primaryAction: { href: '/', label: 'Go Home' },
      secondaryAction: { href: '/activity', label: 'Open Activity' }
    }
  };

  const requestError: ErrorPageContent = {
    eyebrow: 'Request error',
    title: 'This page could not be loaded.',
    message: 'The request failed before SessionGoals could show the page.',
    primaryAction: { href: '/', label: 'Go Home' },
    secondaryAction: { href: '/goals', label: 'Open Goals' }
  };

  const serverError: ErrorPageContent = {
    eyebrow: 'Server error',
    title: 'Something went wrong.',
    message: 'The app hit an unexpected problem while loading this page.',
    primaryAction: { href: '/', label: 'Go Home' },
    secondaryAction: { href: '/activity', label: 'Open Activity' }
  };

  const destinationLinks = [
    { href: '/goals', label: 'Goals' },
    { href: '/lists', label: 'Lists' },
    { href: '/inspiration', label: 'Library' },
    { href: '/spots', label: 'Spots' }
  ];

  $: status = $page.status ?? 500;
  $: content = errorPages[status] ?? (status >= 500 ? serverError : requestError);
  $: pageTitle = `${status} ${content.eyebrow} - SessionGoals`;
  $: canShowErrorMessage = status < 500 && status !== 404;
  $: errorMessage = canShowErrorMessage ? $page.error?.message : null;
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="container page error-page">
  <section class="error-panel" aria-labelledby="error-title">
    <div class="error-copy">
      <p class="error-eyebrow">Error {status} / {content.eyebrow}</p>
      <h1 id="error-title" class="error-title">{content.title}</h1>
      <p class="error-message">{content.message}</p>

      {#if errorMessage && errorMessage !== content.message}
        <p class="error-detail">{errorMessage}</p>
      {/if}

      <div class="error-actions" aria-label="Recovery actions">
        <a href={content.primaryAction.href} class="btn btn-primary">{content.primaryAction.label}</a>
        <a href={content.secondaryAction.href} class="btn btn-ghost">{content.secondaryAction.label}</a>
      </div>
    </div>

    <aside class="error-map" aria-label="SessionGoals destinations">
      <img src="/images/sessiongoals-logo-open.svg" class="error-logo" alt="" width="72" height="72" aria-hidden="true" />
      <div class="error-code" aria-hidden="true">{status}</div>
      <nav class="destination-list" aria-label="Try another page">
        {#each destinationLinks as link}
          <a href={link.href} class="destination-link">{link.label}</a>
        {/each}
      </nav>
    </aside>
  </section>
</div>

<style>
  .error-page {
    min-height: calc(100vh - 180px);
    display: grid;
    align-items: center;
    padding-block: clamp(2.5rem, 7vw, 5rem);
  }

  .error-panel {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
    gap: clamp(1.5rem, 4vw, 3rem);
    align-items: stretch;
    background:
      linear-gradient(135deg, color-mix(in oklch, var(--color-primary) 10%, transparent), transparent 42%),
      var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: clamp(1.25rem, 4vw, 3rem);
    overflow: hidden;
  }

  .error-copy {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    min-width: 0;
  }

  .error-eyebrow {
    color: var(--color-primary-dark);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .error-title {
    max-width: 11ch;
    font-family: var(--font-display);
    font-size: clamp(2.75rem, 8vw, 5.5rem);
    font-weight: 800;
    line-height: 0.92;
    letter-spacing: 0;
  }

  .error-message {
    max-width: 54ch;
    color: var(--color-text-muted);
    font-size: 1.05rem;
  }

  .error-detail {
    max-width: 58ch;
    color: var(--color-text);
    background: color-mix(in oklch, var(--color-warning) 18%, var(--color-surface));
    border: 1px solid color-mix(in oklch, var(--color-warning) 42%, var(--color-border));
    border-radius: var(--radius-sm);
    padding: 0.8rem 0.9rem;
  }

  .error-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding-top: 0.5rem;
  }

  .error-actions .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }

  .error-map {
    position: relative;
    display: grid;
    min-height: 320px;
    align-content: space-between;
    gap: 1.5rem;
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in oklch, var(--color-primary) 22%, var(--color-border));
    background:
      linear-gradient(color-mix(in oklch, var(--color-border) 58%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in oklch, var(--color-border) 58%, transparent) 1px, transparent 1px),
      color-mix(in oklch, var(--color-surface-2) 72%, var(--color-surface));
    background-size: 48px 48px;
    padding: 1.25rem;
    overflow: hidden;
  }

  .error-map::before {
    content: '';
    position: absolute;
    inset: 18% 12% auto auto;
    width: 42%;
    aspect-ratio: 1;
    border: 1px solid color-mix(in oklch, var(--color-primary) 35%, transparent);
    border-radius: 50%;
  }

  .error-logo {
    position: relative;
    display: block;
    width: 72px;
    height: 72px;
    border-radius: var(--radius-md);
  }

  .error-code {
    position: relative;
    justify-self: end;
    align-self: center;
    color: color-mix(in oklch, var(--color-primary) 72%, var(--color-text));
    font-family: var(--font-display);
    font-size: clamp(6rem, 17vw, 10rem);
    font-weight: 800;
    line-height: 0.8;
  }

  .destination-list {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }

  .destination-link {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0.65rem 0.75rem;
    color: var(--color-text);
    background: color-mix(in oklch, var(--color-surface) 88%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
  }

  .destination-link:hover {
    background: var(--color-surface);
    border-color: color-mix(in oklch, var(--color-primary) 42%, var(--color-border));
    text-decoration: none;
  }

  @media (max-width: 780px) {
    .error-panel {
      grid-template-columns: 1fr;
    }

    .error-title {
      max-width: 12ch;
    }

    .error-map {
      min-height: 260px;
    }
  }

  @media (max-width: 480px) {
    .error-page {
      padding-block: 1.5rem;
    }

    .error-panel {
      padding: 1rem;
    }

    .error-actions .btn {
      width: 100%;
    }

    .destination-list {
      grid-template-columns: 1fr;
    }
  }
</style>