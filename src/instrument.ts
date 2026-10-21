import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || undefined,
  enabled: Boolean(import.meta.env.VITE_SENTRY_DSN),
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || "local",
  release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
  dataCollection: { userInfo: false },
  initialScope: {
    tags: {
      service: "bbw-storefront",
      scenario: import.meta.env.VITE_DEMO_SCENARIO || "none",
      demo_run: import.meta.env.VITE_DEMO_RUN_ID || "local",
    },
  },
  beforeSend(event) {
    delete event.request;
    delete event.user;
    delete event.breadcrumbs;
    delete event.extra;
    for (const exception of event.exception?.values ?? []) {
      for (const frame of exception.stacktrace?.frames ?? []) {
        // URLs da página podem conter dados; preservar somente o caminho do script.
        if (frame.filename) frame.filename = frame.filename.split(/[?#]/)[0];
        if (frame.abs_path) frame.abs_path = frame.abs_path.split(/[?#]/)[0];
        delete frame.vars;
      }
    }
    return event;
  },
});
