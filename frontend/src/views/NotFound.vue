<template>
  <main v-if="!isDashboardContext" class="not-found-page">
    <section class="not-found-card not-found-card--public" aria-labelledby="not-found-title">
      <div class="not-found-orbit not-found-orbit--one" aria-hidden="true"></div>
      <div class="not-found-orbit not-found-orbit--two" aria-hidden="true"></div>

      <div class="not-found-brand">
        <img :src="brandLogo" alt="Karibu Groceries LTD logo" class="not-found-brand-logo" />
        <span>Karibu Groceries LTD</span>
      </div>

      <span class="not-found-kicker">Route not found</span>
      <h1 id="not-found-title" class="not-found-code">404</h1>
      <p class="not-found-title">This page does not exist in the system.</p>
      <p class="not-found-copy">
        The address <code>{{ missingPath }}</code> is not available. Use one of the actions below to
        get back into the app.
      </p>

      <div class="not-found-actions">
        <button type="button" class="btn btn-primary" @click="goPrimary">
          {{ primaryActionLabel }}
        </button>
        <button type="button" class="btn btn-outline-secondary" @click="goBack">
          Go Back
        </button>
      </div>
    </section>
  </main>

  <section v-else class="view-shell not-found-panel" aria-labelledby="not-found-title">
    <div class="card not-found-card not-found-card--dashboard">
      <div class="card-body">
        <span class="not-found-kicker">Route not found</span>
        <div class="not-found-inline">
          <div>
            <h1 id="not-found-title" class="page-title">404</h1>
            <p class="not-found-title mb-2">This dashboard page is not available.</p>
            <p class="page-subtitle mb-0">
              The address <code>{{ missingPath }}</code> does not match any page in your workspace.
            </p>
          </div>
          <div class="not-found-actions">
            <button type="button" class="btn btn-primary" @click="goPrimary">
              {{ primaryActionLabel }}
            </button>
            <button type="button" class="btn btn-outline-secondary" @click="goBack">
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import brandLogo from '../assets/images/logo.png';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import { getHomeRouteForUser } from '../utils/directorAccess.js';

export default {
  name: 'NotFound',
  data() {
    return {
      brandLogo
    };
  },
  computed: {
    authStore() {
      return useAuthStore(pinia);
    },
    isAuthenticated() {
      return this.authStore.isAuthenticated;
    },
    isDashboardContext() {
      return this.$route.matched.some((record) => record.path === '/dashboard');
    },
    missingPath() {
      return this.$route.fullPath || '/';
    },
    primaryActionLabel() {
      return this.isAuthenticated ? 'Go to Dashboard' : 'Go to Sign In';
    },
    primaryActionTarget() {
      if (!this.isAuthenticated) return '/';
      return getHomeRouteForUser(this.authStore.user) || '/dashboard/profile';
    }
  },
  methods: {
    goPrimary() {
      this.$router.push(this.primaryActionTarget);
    },
    goBack() {
      if (window.history.length > 1) {
        this.$router.back();
        return;
      }

      this.$router.push(this.primaryActionTarget);
    }
  }
};
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 12% 18%, rgba(14, 165, 233, 0.16), transparent 24%),
    radial-gradient(circle at 88% 12%, rgba(34, 197, 94, 0.18), transparent 28%),
    linear-gradient(160deg, #f8fafc 0%, #eef6ff 52%, #f0fdf4 100%);
}

.not-found-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.1);
}

.not-found-card--public {
  width: min(720px, 100%);
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border-radius: 1.25rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95)),
    #ffffff;
}

.not-found-card--dashboard {
  border-radius: 1rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95)),
    #ffffff;
}

.not-found-orbit {
  position: absolute;
  border-radius: 999px;
  filter: blur(2px);
  opacity: 0.9;
}

.not-found-orbit--one {
  top: -48px;
  right: -28px;
  width: 160px;
  height: 160px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.22), rgba(14, 165, 233, 0));
}

.not-found-orbit--two {
  bottom: -62px;
  left: -38px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(22, 163, 74, 0.2), rgba(22, 163, 74, 0));
}

.not-found-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.1rem;
  padding: 0.45rem 0.75rem 0.45rem 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(203, 213, 225, 0.9);
  font-weight: 700;
  color: #0f172a;
}

.not-found-brand-logo {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 18px rgba(22, 101, 52, 0.16);
}

.not-found-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.not-found-code {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(4rem, 10vw, 6.8rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
  color: #0f172a;
}

.not-found-title {
  margin: 0.6rem 0 0;
  font-size: clamp(1.15rem, 2vw, 1.5rem);
  font-weight: 700;
  color: #0f172a;
}

.not-found-copy {
  margin: 0.8rem 0 0;
  max-width: 48ch;
  color: #475569;
}

.not-found-copy code,
.page-subtitle code {
  display: inline-block;
  margin-top: 0.18rem;
  padding: 0.14rem 0.38rem;
  border-radius: 0.42rem;
  background: rgba(15, 23, 42, 0.06);
  color: #0f172a;
}

.not-found-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.4rem;
}

.not-found-panel .card-body {
  padding: 1.4rem;
}

.not-found-inline {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

@media (max-width: 767.98px) {
  .not-found-card--public {
    border-radius: 1rem;
  }

  .not-found-inline {
    flex-direction: column;
    align-items: flex-start;
  }

  .not-found-actions {
    width: 100%;
  }

  .not-found-actions .btn {
    flex: 1 1 180px;
  }
}
</style>
