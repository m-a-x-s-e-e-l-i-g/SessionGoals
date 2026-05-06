<svelte:head>
  <title>Privacy Policy — SessionGoals</title>
</svelte:head>

<div class="container page legal-page">
  <header class="legal-header">
    <p class="legal-kicker">Legal</p>
    <h1 class="page-title">Privacy Policy</h1>
    <p class="text-muted">Last updated: May 6, 2026</p>
  </header>

  <section class="card legal-card">
    <h2>1. Information We Process</h2>
    <p>
      SessionGoals uses Supabase Authentication with Google as the only sign-in provider. We process account metadata
      needed to authenticate you and maintain your logged-in session.
    </p>

    <h2>2. Product Data</h2>
    <p>
      We store content you create in the app, including goals, lists, and activity tracking entries. This data is used
      only to provide core SessionGoals functionality.
    </p>

    <h2>3. How We Use Data</h2>
    <p>
      Data is used to authenticate your account, display your workspace, and support app features such as tracking and
      progress views.
    </p>

    <h2>4. Third-Party Services</h2>
    <p>
      Authentication is handled by Supabase and Google OAuth. Their handling of your personal information is governed by
      their own privacy policies.
    </p>

    <h2>5. Security</h2>
    <p>
      We use secure transport and managed authentication mechanisms provided by Supabase. No method of storage or
      transmission is fully guaranteed to be secure.
    </p>

    <h2>6. Contact</h2>
    <p>
      Questions about this privacy policy can be directed through the project repository contact channels.
    </p>
  </section>
</div>

<style>
  .legal-page {
    display: grid;
    gap: 1rem;
  }

  .legal-header {
    display: grid;
    gap: 0.4rem;
  }

  .legal-kicker {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .legal-card {
    display: grid;
    gap: 1rem;
    line-height: 1.7;
  }

  .legal-card h2 {
    font-size: 1.05rem;
    font-family: var(--font-display);
    letter-spacing: 0.02em;
    margin-top: 0.5rem;
  }
</style>