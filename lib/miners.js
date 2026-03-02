export const TIERS = [
  { label: "$25K", accountSize: 25000 },
  { label: "$50K", accountSize: 50000 },
  { label: "$100K", accountSize: 100000 },
];

export const MINERS = [
  {
    name: "Vanta Trading",
    slug: "vanta",
    prices: [599, 749, 999],
    take: 0,
    color: "#3b82f6",
    envApiUrlKey: "VANTA_API_URL",
    envWalletKey: "VANTA_WALLET",
  },
  {
    name: "Jolly Green Trading",
    slug: "jolly",
    prices: [1, 2, 3],
    take: 10,
    color: "#22c55e",
    envApiUrlKey: "JOLLY_API_URL",
    envWalletKey: "JOLLY_WALLET",
  },
  {
    name: "Bitcast Trading",
    slug: "bitcast",
    prices: [429, 559, 829],
    take: 10,
    color: "#a855f7",
    envApiUrlKey: "BITCAST_API_URL",
    envWalletKey: "BITCAST_WALLET",
  },
  {
    name: "Talisman Trading",
    slug: "talisman",
    prices: [389, 519, 769],
    take: 15,
    color: "#eab308",
    envApiUrlKey: "TALISMAN_API_URL",
    envWalletKey: "TALISMAN_WALLET",
  },
  {
    name: "Zoku Trading",
    slug: "zoku",
    prices: [349, 469, 699],
    take: 20,
    color: "#a855f7",
    envApiUrlKey: "ZOKU_API_URL",
    envWalletKey: "ZOKU_WALLET",
  },
];

export function getMinerBySlug(slug) {
  return MINERS.find((m) => m.slug === slug) || null;
}

export function getMinerApiUrl(miner) {
  return process.env[miner.envApiUrlKey] || null;
}

export function getMinerWalletAddress(miner) {
  return process.env[miner.envWalletKey] || null;
}
