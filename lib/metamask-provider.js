export function getMetaMaskProvider() {
  if (typeof window === "undefined") return undefined;
  const ethereum = window.ethereum;
  if (!ethereum) return undefined;

  if (Array.isArray(ethereum.providers)) {
    const fromList = ethereum.providers.find(
      (p) => p?.isMetaMask && !p?.isCoinbaseWallet,
    );
    if (fromList) return fromList;
  }

  if (ethereum.isMetaMask && !ethereum.isCoinbaseWallet) {
    return ethereum;
  }

  return undefined;
}

export function findMetaMaskConnector(connectors) {
  if (!Array.isArray(connectors)) return null;
  return (
    connectors.find((c) => c.id === "metaMask") ||
    connectors.find((c) => c.id === "metaMaskSDK") ||
    connectors.find((c) => c.id === "io.metamask") ||
    connectors.find((c) => c.id?.toLowerCase?.().includes("metamask")) ||
    connectors.find((c) => c.name === "MetaMask") ||
    null
  );
}
