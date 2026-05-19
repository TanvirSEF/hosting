import * as Sentry from "@sentry/nextjs";
export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// A faulty API route to test Sentry's error monitoring
export function GET() {
  Sentry.logger.info("Sentry example API called");

  // Test Sentry metrics
  Sentry.metrics.count("test_metric", 1);
  Sentry.metrics.distribution("test_api_response_time", 150);
  Sentry.metrics.increment("api_calls_total", 1, { tags: { route: "sentry-example-api" } });

  throw new SentryExampleAPIError(
    "This error is raised on the backend called by the example page.",
  );
}
