export const DEV_TEST_PRICE = 0.01;

function getDevTestWallets() {
  const raw = process.env.DEV_TEST_WALLETS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => /^0x[a-f0-9]{40}$/.test(w));
}

export function isDevTestWallet(address) {
  if (!address) return false;
  return getDevTestWallets().includes(address.toLowerCase());
}
