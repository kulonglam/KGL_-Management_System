<template>
  <div class="container py-5" style="max-width: 42rem">
    <h1 class="h3">Privacy notice</h1>
    <p>
      Karibu Groceries LTD keeps buyer and staff records so it can sell produce, collect credit, and run its branches.
      National ID numbers are encrypted at rest. Access is limited to staff who need it for that work.
    </p>
    <h2 class="h5">What we keep</h2>
    <ul>
      <li>Name, phone, email, branch, and national ID for trusted buyers</li>
      <li>Sales, credit balances, repayments, and write-offs</li>
      <li>Staff account details, excluding passwords shown back to the browser</li>
    </ul>
    <h2 class="h5">Your request</h2>
    <p>
      A director can export the data held about a buyer or a staff account from Finance, Privacy. Ask a director if you
      want a copy, a correction, or deletion after the legal retention period.
    </p>
    <p class="text-muted">
      If you believe data was exposed, tell a director the same day. They record the incident and decide who must be
      notified.
    </p>
    <router-link to="/">Back to sign in</router-link>
  </div>
</template>

<script>
export default { name: 'PrivacyNotice' };
</script>
