import { isValidEvmAddress } from "@/lib/validation";
import { STUB_ENABLED, stubStatus } from "@/lib/gateway-stubs";

export async function resolveEndpointUrl(hlAddress) {
  if (!hlAddress || !isValidEvmAddress(hlAddress)) {
    const err = new Error("Invalid or missing hl_address");
    err.status = 400;
    throw err;
  }

  // STUB: return fake endpoint when gateway is offline
  if (STUB_ENABLED) {
    return { endpoint_url: stubStatus.endpoint_url, hl_address: hlAddress };
  }

  const validatorUrl = process.env.VALIDATOR_API_URL;
  if (!validatorUrl) {
    const err = new Error("Validator API not configured");
    err.status = 500;
    throw err;
  }

  let res;
  try {
    res = await fetch(
      `${validatorUrl}/entity/endpoint?hl_address=${hlAddress}`,
    );
  } catch {
    const err = new Error("Could not reach validator");
    err.status = 502;
    throw err;
  }

  if (res.ok) {
    return await res.json();
  }

  if (res.status === 404) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }

  const err = new Error(`Validator returned ${res.status}`);
  err.status = 502;
  throw err;
}
