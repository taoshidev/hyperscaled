export default function RulesTable({ rules, label }) {
  return (
    <div>
      {label && (
        <h3 className="text-xs text-zinc-500 tracking-widest uppercase mb-4 font-medium">
          {label}
        </h3>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">
                Rule
              </th>
              <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">
                Parameter
              </th>
            </tr>
          </thead>
          <tbody>
            {rules.map((row, i) => (
              <tr
                key={row.rule}
                className={i < rules.length - 1 ? 'border-b border-white/[0.04]' : ''}
              >
                <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                  {row.rule}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {row.parameter}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-3">
        {rules.map((row) => (
          <div
            key={row.rule}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <div className="text-white font-medium text-sm mb-1">
              {row.rule}
            </div>
            <div className="text-zinc-400 text-sm leading-relaxed">
              {row.parameter}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
