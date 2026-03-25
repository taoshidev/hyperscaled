import { resolveEndpointUrl } from "@/lib/gateway";
import { STUB_ENABLED, stubDashboard } from "@/lib/gateway-stubs";
import { reportError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

/** Return a valid SSE response containing a single error event, then close. */
function sseError(message) {
  const encoder = new TextEncoder();
  const payload = JSON.stringify({ type: "error", message });
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      controller.close();
    },
  });
  return new Response(body, { headers: SSE_HEADERS });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hlAddress = searchParams.get("hl_address");

  // STUB: return a no-op SSE stream when gateway is offline
  if (STUB_ENABLED) {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        const msg = JSON.stringify({ type: "dashboard", data: stubDashboard });
        controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
        // Keep connection open, close when client disconnects
        request.signal.addEventListener("abort", () => controller.close());
      },
    });
    return new Response(body, { headers: SSE_HEADERS });
  }

  let endpoint_url, hl_address;
  try {
    ({ endpoint_url, hl_address } = await resolveEndpointUrl(hlAddress));
  } catch (err) {
    reportError(err, { source: "api/dashboard/stream", userId: hlAddress });
    return sseError(err.message);
  }

  let upstream;
  try {
    upstream = await fetch(`${endpoint_url}/api/hl/${hl_address}/stream`, {
      signal: request.signal,
    });
  } catch (err) {
    reportError(err, { source: "api/dashboard/stream", userId: hlAddress });
    return sseError("Could not reach gateway");
  }

  if (!upstream.ok) {
    return sseError(`Gateway returned ${upstream.status}`);
  }

  const body = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
          }
        } catch {
          controller.close();
        }
      };

      request.signal.addEventListener("abort", () => {
        reader.cancel();
        controller.close();
      });

      pump();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
