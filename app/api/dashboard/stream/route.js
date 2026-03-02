import { resolveEndpointUrl } from "@/lib/gateway";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hlAddress = searchParams.get("hl_address");

  let endpoint_url, hl_address;
  try {
    ({ endpoint_url, hl_address } = await resolveEndpointUrl(hlAddress));
  } catch (err) {
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
  } catch {
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
