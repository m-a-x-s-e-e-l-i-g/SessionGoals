<svelte:head>
  <title>Terms of Use — SessionGoals</title>
</svelte:head>

<div class="container page legal-page">
  <header class="legal-header">
    <p class="legal-kicker">Legal</p>
    <h1 class="page-title">Terms of Use</h1>
    <p class="text-muted">Last updated: May 6, 2026</p>
  </header>

  <section class="card legal-card">
    <h2>1. Eligibility and Account Access</h2>
    <p>
      You must sign in with a valid Google account to use SessionGoals. You are responsible for maintaining the
      confidentiality of your account access and for all activity performed under your session.
    </p>

    <h2>2. Acceptable Use</h2>
    <p>
      You agree not to misuse the service, attempt unauthorized access, interfere with platform integrity, or upload
      content that violates applicable laws or third-party rights.
    </p>

    <h2>3. User Content</h2>
    <p>
      You retain ownership of content you create in SessionGoals, including goals, lists, and activity logs. You grant
      SessionGoals a limited license to store and process that data solely to operate the product.
    </p>

    <h2>4. Service Availability</h2>
    <p>
      SessionGoals is provided on an "as available" basis. We may update, suspend, or discontinue parts of the service
      at any time.
    </p>

    <h2>5. Limitation of Liability</h2>
    <p>
      To the fullest extent permitted by law, SessionGoals is not liable for indirect, incidental, or consequential
      damages arising from your use of the service.
    </p>

    <h2>6. Contact</h2>
    <p>
      Questions about these terms can be directed through the project repository contact channels.
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