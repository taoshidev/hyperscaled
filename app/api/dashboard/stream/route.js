import { resolveEndpointUrl } from "@/lib/gateway";
import { STUB_ENABLED, stubDashboard } from "@/lib/gateway-stubs";
import { reportError } from "@/lib/errors";

export const dynamic = "force-dynamic";

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
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  let endpoint_url, hl_address;
  try {
    ({ endpoint_url, hl_address } = await resolveEndpointUrl(hlAddress));
  } catch (err) {
    reportError(err, { source: "api/dashboard/stream", userId: hlAddress });
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.status || 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let upstream;
  try {
    upstream = await fetch(`${endpoint_url}/api/hl/${hl_address}/stream`, {
      signal: request.signal,
    });
  } catch (err) {
    reportError(err, { source: "api/dashboard/stream", userId: hlAddress });
    return new Response(JSON.stringify({ error: "Could not reach gateway" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: `Gateway returned ${upstream.status}` }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
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
