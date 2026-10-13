// Shared seed password policy so login, registration, and seeding reject the published demo secret.

const DOCUMENTED_SEED_PASSWORD = 'Karibu@2026!';

const rejectDocumentedPassword = (password) =>
  String(password || '') === DOCUMENTED_SEED_PASSWORD
    ? 'Choose a password other than the documented demo password'
    : null;

export { DOCUMENTED_SEED_PASSWORD, rejectDocumentedPassword };
