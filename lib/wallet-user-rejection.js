export function isWalletUserRejection(error) {
  if (!error) return false;
  const code = error.code ?? error.cause?.code;
  if (code === 4001) return true;
  const name = error.name ?? "";
  if (name.includes("UserRejected")) return true;
  const msg = String(error.message ?? error.shortMessage ?? "").toLowerCase();
  return msg.includes("user rejected") || msg.includes("user denied");
}

export function isWalletRequestPending(error) {
  if (!error) return false;
  const code = error.code ?? error.cause?.code;
  if (code === -32002) return true;
  const msg = String(error.message ?? "").toLowerCase();
  return msg.includes("already pending");
}
