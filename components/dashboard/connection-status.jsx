"use client";

const statusConfig = {
  connected: { color: "bg-green-400", label: "Live", pulse: false },
  connecting: { color: "bg-yellow-400", label: "Connecting...", pulse: true },
  error: { color: "bg-red-400", label: "Reconnecting...", pulse: true },
  disconnected: { color: "bg-gray-400", label: "Offline", pulse: false },
};

export function ConnectionStatus({ status }) {
  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 animate-ping`}
          />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.color}`}
        />
      </span>
      {config.label}
    </div>
  );
}
