import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import {
  AdminStickyTableHeader,
  AdminTableEmptyState,
  AdminTablePageRoot,
  AdminTablePaginationBar,
  AdminTableScrollCard,
  adminHeaderRowClass,
  adminTableHeadClass,
} from "@/components/admin/AdminTablePage";
import { RetryRowButton } from "@/components/admin/views/RegistrationRetryControls";
import { registrationsAdminHref as tabHref } from "@/lib/admin/registrations-command-center";
import { BASESCAN_URL, HL_EXPLORER_TX_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TAB_DEFS = [
  { id: "attention", label: "Needs attention" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
];

const EMPTY_COPY = {
  attention: "Nothing needs attention. Every paid registration has been provisioned.",
  pending: "No pending registrations.",
  failed: "No failed registrations.",
};

function shortenHash(value) {
  if (!value) return "—";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function formatTs(iso) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function formatUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAccountSize(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n >= 1000 && n % 1000 === 0 ? `$${n / 1000}K` : `$${n.toLocaleString()}`;
}

/**
 * Hyperliquid-paid registrations (`hyperliquid` from the extension,
 * `eip712` from the site) carry an HL L1 transfer hash; x402 registrations
 * carry a Base transaction hash.
 */
function txExplorerHref(row) {
  if (!row.txHash) return null;
  const method = row.statusDetail?.paymentMethod;
  if (method === "hyperliquid" || method === "eip712") {
    return `${HL_EXPLORER_TX_URL}/${row.txHash}`;
  }
  if (method === "x402" || method === "free") {
    return method === "free" ? null : `${BASESCAN_URL}/tx/${row.txHash}`;
  }
  // Unknown payment method (row written before paymentMethod was recorded):
  // don't guess a chain, just show the hash.
  return null;
}

function detailText(detail) {
  if (!detail || typeof detail !== "object") return "";
  const err = detail.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    return err.message || err.error || JSON.stringify(err);
  }
  return "";
}

function StatusBadge({ status }) {
  const styles =
    status === "pending"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
      : status === "failed"
        ? "border-red-400/30 bg-red-400/10 text-red-300"
        : "border-teal-400/30 bg-teal-400/10 text-teal-300";
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize", styles)}>
      {status}
    </span>
  );
}

export function RegistrationsAdminView({ result }) {
  const { rows, total, page, pageSize, status } = result;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminTablePageRoot>
      <div className="flex shrink-0 flex-wrap gap-1">
        {TAB_DEFS.map((t) => {
          const active = status === t.id;
          if (active) {
            return (
              <span
                key={t.id}
                className="rounded-lg border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-sm font-medium text-teal-400"
              >
                {t.label}
              </span>
            );
          }
          return (
            <Link
              key={t.id}
              href={tabHref(t.id)}
              prefetch={false}
              className="rounded-lg border border-transparent px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/40">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-white">Registrations</h2>
            <span className="text-xs text-zinc-500">({total})</span>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AdminTableScrollCard className="min-h-[240px] flex-1 rounded-none border-0 bg-transparent">
            {rows.length === 0 ? (
              <AdminTableEmptyState>{EMPTY_COPY[status] ?? EMPTY_COPY.attention}</AdminTableEmptyState>
            ) : (
              <Table containerClassName="overflow-visible">
                <AdminStickyTableHeader>
                  <TableRow className={adminHeaderRowClass}>
                    <TableHead className={cn(adminTableHeadClass, "w-16")}>ID</TableHead>
                    <TableHead className={adminTableHeadClass}>Created</TableHead>
                    <TableHead className={adminTableHeadClass}>HL address</TableHead>
                    <TableHead className={adminTableHeadClass}>Miner</TableHead>
                    <TableHead className={adminTableHeadClass}>Account</TableHead>
                    <TableHead className={adminTableHeadClass}>Paid</TableHead>
                    <TableHead className={adminTableHeadClass}>Status</TableHead>
                    <TableHead className={adminTableHeadClass}>Last miner response</TableHead>
                    <TableHead className={cn(adminTableHeadClass, "w-28 text-right")}>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </AdminStickyTableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const explorer = txExplorerHref(row);
                    const detail = detailText(row.statusDetail);
                    const reason = row.statusDetail?.reason;
                    const payerDiffers =
                      row.payerAddress && row.payerAddress.toLowerCase() !== row.hlAddress.toLowerCase();
                    return (
                      <TableRow key={row.id} className="border-white/[0.06]">
                        <TableCell className="font-mono text-xs text-zinc-400">{row.id}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-zinc-300">
                          {formatTs(row.createdAt)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-white" title={row.hlAddress}>
                          {shortenHash(row.hlAddress)}
                          {payerDiffers ? (
                            <span className="block text-zinc-500" title={row.payerAddress}>
                              payer {shortenHash(row.payerAddress)}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-300" title={row.minerHotkey}>
                          {row.minerName || row.minerSlug || shortenHash(row.minerHotkey)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-300">
                          {formatAccountSize(row.accountSize)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-300">
                          {formatUsd(row.priceUsdc)}
                          {explorer ? (
                            <a
                              href={explorer}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-teal-400 transition-colors hover:text-teal-300"
                              title={row.txHash}
                            >
                              {shortenHash(row.txHash)}
                            </a>
                          ) : row.txHash ? (
                            <span className="block text-zinc-500" title={row.txHash}>
                              {shortenHash(row.txHash)}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="max-w-[28rem] text-xs text-zinc-400">
                          {reason ? <span className="font-mono text-zinc-500">{reason}</span> : null}
                          {detail ? (
                            <span className="block truncate text-zinc-300" title={detail}>
                              {detail}
                            </span>
                          ) : null}
                          {!reason && !detail ? "—" : null}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.status === "pending" ? <RetryRowButton id={row.id} /> : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </AdminTableScrollCard>
          {totalPages > 1 ? (
            <AdminTablePaginationBar>
              <span className="text-xs text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={tabHref(status, page - 1)}
                    prefetch={false}
                    className="rounded-md border border-white/[0.08] px-2 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    Previous
                  </Link>
                ) : null}
                {page < totalPages ? (
                  <Link
                    href={tabHref(status, page + 1)}
                    prefetch={false}
                    className="rounded-md border border-white/[0.08] px-2 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </AdminTablePaginationBar>
          ) : null}
        </div>
      </div>
    </AdminTablePageRoot>
  );
}
