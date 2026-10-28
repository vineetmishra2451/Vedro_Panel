/**
 * Lightweight, production-safe performance observability utility for Next.js App Router.
 * Emits W3C Server-Timing headers and structured, non-PII latency metrics.
 */

export interface PerfMetrics {
  operation: string;
  requestId: string;
  durationMs: number;
  steps: Record<string, number>;
  serverTimingHeader: string;
}

export function startPerf(operationName: string, req?: Request) {
  const startTime = performance.now();
  const requestId =
    req?.headers.get("x-request-id") ||
    `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const steps: Record<string, number> = {};

  return {
    requestId,
    operation: operationName,

    /**
     * Measure an asynchronous or synchronous step (e.g. database query, calculation)
     */
    async step<T>(stepName: string, fn: () => Promise<T> | T): Promise<T> {
      const stepStart = performance.now();
      try {
        return await fn();
      } finally {
        const stepDuration = Math.round((performance.now() - stepStart) * 10) / 10;
        steps[stepName] = (steps[stepName] || 0) + stepDuration;
      }
    },

    /**
     * Conclude the performance measurement, emit structured log, and format Server-Timing header
     */
    end(status = 200, extraMetrics?: Record<string, any>): PerfMetrics {
      const totalDuration = Math.round((performance.now() - startTime) * 10) / 10;
      
      // Build W3C Server-Timing header: e.g. "db;dur=24.5, total;dur=45.2"
      const timingParts = Object.entries(steps).map(
        ([name, dur]) => `${name};dur=${dur}`
      );
      timingParts.push(`total;dur=${totalDuration}`);
      const serverTimingHeader = timingParts.join(", ");

      // Structured logging (clean, zero PII, zero credentials)
      if (process.env.NODE_ENV !== "test") {
        const logData = {
          tag: "[PERF]",
          op: operationName,
          reqId: requestId,
          status,
          totalMs: totalDuration,
          ...steps,
          ...(extraMetrics ? extraMetrics : {}),
        };
        console.log(JSON.stringify(logData));
      }

      return {
        operation: operationName,
        requestId,
        durationMs: totalDuration,
        steps,
        serverTimingHeader,
      };
    },
  };
}

/**
 * Helper to attach Server-Timing and request ID headers to a NextResponse
 */
export function withPerfHeaders(response: Response, perf: ReturnType<typeof startPerf>, status = 200) {
  const metrics = perf.end(status);
  response.headers.set("Server-Timing", metrics.serverTimingHeader);
  response.headers.set("X-Request-Id", metrics.requestId);
  response.headers.set("X-Response-Time-Ms", metrics.durationMs.toString());
  return response;
}
