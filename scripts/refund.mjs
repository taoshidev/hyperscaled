import pg from "pg";
import { config } from "dotenv";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

config({ path: ".env.local" });

const USE_TESTNET = process.env.USE_TESTNET === "true";

const USDC_ADDRESS = USE_TESTNET
  ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

const HL_API_URL = USE_TESTNET
  ? "https://api.hyperliquid-testnet.xyz"
  : "https://api.hyperliquid.xyz";
const HL_SIGNING_CHAIN_ID = USE_TESTNET ? 421614 : 42161;
const HL_CHAIN_NAME = USE_TESTNET ? "Testnet" : "Mainnet";

const usdcAbi = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

const args = process.argv.slice(2);

function takeFlag(name) {
  const idx = args.findIndex((a) => a === name || a.startsWith(`${name}=`));
  if (idx === -1) return null;
  const flag = args[idx];
  if (flag.includes("=")) {
    const value = flag.split("=")[1];
    args.splice(idx, 1);
    return value;
  }
  const value = args[idx + 1];
  args.splice(idx, 2);
  return value;
}

function takeBool(name) {
  const idx = args.findIndex((a) => a === name);
  if (idx === -1) return false;
  args.splice(idx, 1);
  return true;
}

let railOverride = takeFlag("--rail");
if (railOverride && railOverride !== "hl" && railOverride !== "base") {
  console.error(`Invalid --rail value "${railOverride}" (expected hl|base)`);
  process.exit(1);
}
const amountOverride = takeFlag("--amount");
if (amountOverride != null && !/^\d+(\.\d+)?$/.test(amountOverride)) {
  console.error(`Invalid --amount value "${amountOverride}"`);
  process.exit(1);
}
const force = takeBool("--force");
const deregister = takeBool("--deregister");

const paymentWalletArg = args[0];

if (!paymentWalletArg || !/^0x[a-fA-F0-9]{40}$/.test(paymentWalletArg)) {
  console.error(
    "Usage: REFUND_PRIVATE_KEY=0x... node scripts/refund.mjs <paymentWalletAddress> [--rail hl|base]",
  );
  process.exit(1);
}

const paymentWallet = paymentWalletArg;
const paymentWalletLower = paymentWallet.toLowerCase();

let privateKey = process.env.REFUND_PRIVATE_KEY;
if (!privateKey) {
  console.error("REFUND_PRIVATE_KEY not set");
  process.exit(1);
}
if (!privateKey.startsWith("0x")) privateKey = "0x" + privateKey;
if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
  console.error("REFUND_PRIVATE_KEY is not a valid 32-byte hex key");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const isRemote =
  !connectionString.includes("127.0.0.1") &&
  !connectionString.includes("localhost");

const pool = new pg.Pool({
  connectionString,
  ...(isRemote && { ssl: { rejectUnauthorized: false } }),
});

async function main() {
  const client = await pool.connect();
  try {
    const { rows: minerRows } = await client.query(
      `SELECT hotkey, slug, usdc_wallet FROM entity_miners WHERE usdc_wallet IS NOT NULL`,
    );
    const minerWallets = new Map(
      minerRows
        .filter((r) => r.usdc_wallet)
        .map((r) => [r.usdc_wallet.toLowerCase(), r]),
    );
    if (!minerWallets.size) {
      console.warn("No miner USDC wallets found in entity_miners.");
    }

    const hlPayment = await findHlPayment(paymentWallet, minerWallets);
    if (hlPayment) {
      console.log("HL on-chain payment found:");
      console.log(hlPayment);
    } else {
      console.log("No recent HL USDC send from this wallet to a known miner wallet.");
    }

    const { rows: regRows } = await client.query(
      `SELECT id, hl_address, payout_address, tx_hash, price_usdc, status, status_detail, created_at
       FROM registrations
       WHERE ($1::text IS NOT NULL AND lower(tx_hash) = $1)
          OR lower(payout_address) = $2
          OR lower(hl_address) = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [hlPayment?.hash?.toLowerCase() ?? null, paymentWalletLower],
    );
    const reg = regRows[0] || null;

    if (reg) {
      console.log("Matching registration:");
      console.log({
        id: reg.id,
        status: reg.status,
        paymentMethod: reg.status_detail?.paymentMethod,
        amount: reg.price_usdc,
        txHash: reg.tx_hash,
        createdAt: reg.created_at,
      });
      if (reg.status === "refunded" && !force) {
        console.error(
          `Registration ${reg.id} is already refunded. Pass --force to send another refund.`,
        );
        process.exit(1);
      }
      if (reg.status === "refunded" && force) {
        console.warn(
          `Registration ${reg.id} is already refunded — proceeding due to --force.`,
        );
      }
    }

    if (!hlPayment && !reg) {
      console.error("No on-chain payment and no DB row — nothing to refund.");
      process.exit(1);
    }

    const dbAmount = reg ? Number(reg.price_usdc) : null;
    const onchainAmount = hlPayment ? Number(hlPayment.amount) : null;
    let amountNum;
    let amountStr;
    if (amountOverride != null) {
      amountStr = amountOverride;
      amountNum = Number(amountOverride);
      console.log(`Amount overridden via --amount: ${amountStr}`);
    } else if (onchainAmount != null) {
      amountStr = String(hlPayment.amount);
      amountNum = onchainAmount;
    } else {
      amountStr = String(reg.price_usdc);
      amountNum = dbAmount;
    }

    if (
      amountOverride == null &&
      onchainAmount != null &&
      dbAmount != null &&
      Math.abs(onchainAmount - dbAmount) > 0.01
    ) {
      console.warn(
        `DB priceUsdc (${dbAmount}) differs from on-chain amount (${onchainAmount}). Using on-chain.`,
      );
    }

    const detectedRail = hlPayment
      ? "hl"
      : (() => {
          const m = reg?.status_detail?.paymentMethod;
          return m === "hyperliquid" || m === "eip712" ? "hl" : "base";
        })();
    const rail = railOverride || detectedRail;
    if (railOverride && railOverride !== detectedRail) {
      console.log(`Rail overridden: detected=${detectedRail} → using=${rail}`);
    }

    const account = privateKeyToAccount(privateKey);
    console.log(`Refund signer: ${account.address}`);
    console.log(`Refunding ${amountStr} USDC to ${paymentWallet} via ${rail}…`);

    const refundTx =
      rail === "base"
        ? await refundBase(account, paymentWallet, amountStr)
        : await refundHL(account, paymentWallet, amountStr, amountNum);

    console.log(`Refund tx: ${refundTx}`);

    let deregisterResult = null;
    if (deregister) {
      deregisterResult = await deregisterSubaccount(
        reg?.hl_address || paymentWallet,
      );
      console.log("Deregister:", deregisterResult);
    }

    if (reg) {
      const prior = reg.status_detail?.refundTxHash
        ? [
            ...(reg.status_detail.priorRefunds || []),
            {
              refundedAt: reg.status_detail.refundedAt,
              refundTxHash: reg.status_detail.refundTxHash,
              refundAmount: reg.status_detail.refundAmount,
              refundRail: reg.status_detail.refundRail,
              refundTo: reg.status_detail.refundTo,
              refundSigner: reg.status_detail.refundSigner,
            },
          ]
        : reg.status_detail?.priorRefunds || [];

      const patch = {
        refundedAt: new Date().toISOString(),
        refundTxHash: refundTx,
        refundAmount: amountStr,
        refundRail: rail,
        refundTo: paymentWallet,
        refundSigner: account.address,
        ...(prior.length ? { priorRefunds: prior } : {}),
        ...(hlPayment
          ? {
              refundSourceOnchainHash: hlPayment.hash,
              refundSourceOnchainDestination: hlPayment.destination,
            }
          : {}),
        ...(deregisterResult ? { deregister: deregisterResult } : {}),
      };
      await client.query(
        `UPDATE registrations
         SET status = 'refunded',
             status_detail = COALESCE(status_detail, '{}'::jsonb) || $2::jsonb,
             updated_at = now()
         WHERE id = $1`,
        [reg.id, JSON.stringify(patch)],
      );
      console.log(`Registration ${reg.id} marked refunded.`);
    } else {
      console.log("No DB row to update — refund recorded on-chain only.");
    }
  } catch (err) {
    console.error("Refund failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

async function findHlPayment(sender, minerWallets) {
  const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
  const res = await fetch(`${HL_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "userNonFundingLedgerUpdates",
      user: sender,
      startTime: Date.now() - WINDOW_MS,
    }),
  });
  if (!res.ok) {
    console.warn(`HL ledger lookup failed (${res.status}); skipping on-chain check.`);
    return null;
  }
  const updates = await res.json();
  if (!Array.isArray(updates)) return null;

  const sends = updates
    .map((u) => ({ u, d: u?.delta }))
    .filter(
      ({ d }) =>
        d &&
        (d.type === "send" || d.type === "spotSend") &&
        d.token === "USDC" &&
        (d.user || "").toLowerCase() === sender.toLowerCase(),
    )
    .sort((a, b) => (b.u.time || 0) - (a.u.time || 0));

  for (const { u, d } of sends) {
    const dest = (d.destination || "").toLowerCase();
    if (minerWallets.has(dest)) {
      return {
        hash: u.hash,
        time: u.time,
        amount: Math.abs(Number(d.amount ?? d.usdcValue ?? 0)),
        destination: d.destination,
        minerSlug: minerWallets.get(dest)?.slug,
        minerHotkey: minerWallets.get(dest)?.hotkey,
      };
    }
  }
  return null;
}

async function refundBase(account, to, amountStr) {
  const chain = USE_TESTNET ? baseSepolia : base;
  const rpcUrl = process.env.BASE_RPC_URL || undefined;
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  const balance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log(
    `Base USDC balance: ${formatUnits(balance, USDC_DECIMALS)} (signer ${account.address})`,
  );

  const amountWei = parseUnits(amountStr, USDC_DECIMALS);
  if (balance < amountWei) {
    throw new Error(
      `Insufficient Base USDC: need ${amountStr}, have ${formatUnits(balance, USDC_DECIMALS)}`,
    );
  }

  const hash = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "transfer",
    args: [to, amountWei],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Base USDC transfer reverted: ${hash}`);
  }
  return hash;
}

async function refundHL(account, to, amountStr, amountNum) {
  const stateRes = await fetch(`${HL_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "spotClearinghouseState",
      user: account.address,
    }),
  });
  if (!stateRes.ok) {
    throw new Error(`HL spotClearinghouseState HTTP ${stateRes.status}`);
  }
  const state = await stateRes.json();
  const usdc = (state.balances || []).find((b) => b.coin === "USDC");
  const balance = Number(usdc?.total || 0);
  console.log(
    `HL spot USDC balance: ${balance} (signer ${account.address})`,
  );
  if (balance < amountNum) {
    throw new Error(
      `Insufficient HL USDC: need ${amountStr}, have ${balance}`,
    );
  }

  const preRes = await fetch(`${HL_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "userNonFundingLedgerUpdates",
      user: account.address,
      startTime: Date.now() - 60 * 60 * 1000,
    }),
  });
  const preUpdates = preRes.ok ? await preRes.json() : [];
  const preHashes = new Set(
    Array.isArray(preUpdates)
      ? preUpdates.map((u) => (u.hash || "").toLowerCase()).filter(Boolean)
      : [],
  );
  const sendStart = Date.now();

  const nonce = Date.now();
  const message = {
    hyperliquidChain: HL_CHAIN_NAME,
    destination: to,
    sourceDex: "spot",
    destinationDex: "spot",
    token: "USDC",
    amount: amountStr,
    fromSubAccount: "",
    nonce,
  };

  const signature = await account.signTypedData({
    domain: {
      name: "HyperliquidSignTransaction",
      version: "1",
      chainId: HL_SIGNING_CHAIN_ID,
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    types: {
      "HyperliquidTransaction:SendAsset": [
        { name: "hyperliquidChain", type: "string" },
        { name: "destination", type: "string" },
        { name: "sourceDex", type: "string" },
        { name: "destinationDex", type: "string" },
        { name: "token", type: "string" },
        { name: "amount", type: "string" },
        { name: "fromSubAccount", type: "string" },
        { name: "nonce", type: "uint64" },
      ],
    },
    primaryType: "HyperliquidTransaction:SendAsset",
    message,
  });

  const r = "0x" + signature.slice(2, 66);
  const s = "0x" + signature.slice(66, 130);
  const v = parseInt(signature.slice(130, 132), 16);

  const res = await fetch(`${HL_API_URL}/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: {
        type: "sendAsset",
        signatureChainId: "0x" + HL_SIGNING_CHAIN_ID.toString(16),
        ...message,
      },
      nonce,
      signature: { r, s, v },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HL exchange HTTP ${res.status}: ${text}`);
  }
  const result = await res.json();
  if (result.status !== "ok") {
    const resp =
      typeof result.response === "string"
        ? result.response
        : JSON.stringify(result);
    throw new Error(`HL exchange error: ${resp}`);
  }

  const start = Date.now();
  const LOOKUP_MS = 60 * 1000;
  while (Date.now() - start < LOOKUP_MS) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await fetch(`${HL_API_URL}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "userNonFundingLedgerUpdates",
        user: account.address,
        startTime: sendStart - 5000,
      }),
    });
    if (!poll.ok) continue;
    const updates = await poll.json();
    if (!Array.isArray(updates)) continue;
    const match = updates.find((u) => {
      const d = u.delta;
      const hash = (u.hash || "").toLowerCase();
      return (
        d &&
        d.type === "send" &&
        d.token === "USDC" &&
        (d.destination || "").toLowerCase() === to.toLowerCase() &&
        Math.abs(Number(d.amount || 0) - amountNum) < 0.01 &&
        hash &&
        !preHashes.has(hash)
      );
    });
    if (match?.hash) return match.hash;
  }
  return `hl-refund-${nonce}`;
}

async function deregisterSubaccount(hlAddress) {
  const validatorUrl = process.env.VALIDATOR_API_URL;
  const apiKey =
    process.env.VALIDATOR_ADMIN_API_KEY || process.env.VALIDATOR_API_KEY;
  if (!validatorUrl || !apiKey) {
    return {
      ok: false,
      error:
        "VALIDATOR_API_URL and VALIDATOR_ADMIN_API_KEY (tier 200) or VALIDATOR_API_KEY not set",
    };
  }

  let syntheticHotkey;
  let subaccountId;
  try {
    const res = await fetch(`${validatorUrl}/hl-traders/${hlAddress}`);
    if (!res.ok) {
      return { ok: false, error: `hl-traders lookup HTTP ${res.status}` };
    }
    const data = await res.json();
    syntheticHotkey = data.dashboard?.subaccount_info?.synthetic_hotkey;
    subaccountId = data.dashboard?.subaccount_info?.subaccount_id;
    if (!syntheticHotkey || subaccountId == null) {
      return { ok: false, error: "synthetic_hotkey or subaccount_id missing" };
    }
  } catch (err) {
    return { ok: false, error: `hl-traders lookup failed: ${err.message}` };
  }

  const lastUnderscore = syntheticHotkey.lastIndexOf("_");
  const entityHotkey =
    lastUnderscore > 0 ? syntheticHotkey.slice(0, lastUnderscore) : syntheticHotkey;

  try {
    const res = await fetch(`${validatorUrl}/entity/subaccount/eliminate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        entity_hotkey: entityHotkey,
        subaccount_id: subaccountId,
        reason: "refunded",
      }),
    });
    const body = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      entityHotkey,
      subaccountId,
      syntheticHotkey,
      response: body,
    };
  } catch (err) {
    return { ok: false, error: `eliminate call failed: ${err.message}` };
  }
}

main();
