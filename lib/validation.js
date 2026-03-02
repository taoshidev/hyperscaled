export function isValidHLAddress(address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidEvmAddress(address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}
