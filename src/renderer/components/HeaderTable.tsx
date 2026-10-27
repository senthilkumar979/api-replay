interface HeaderTableProps {
  headers: Record<string, string>
}

export const HeaderTable = ({ headers }: HeaderTableProps) => {
  const entries = Object.entries(headers)
  if (entries.length === 0) return <p className="text-sm text-fg-muted">No headers</p>

  return (
    <table className="w-full text-left text-xs">
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key} className="border-b border-line/70">
            <th className="w-48 py-2 pr-3 font-mono text-[12px] font-medium text-fg-muted">{key}</th>
            <td className="py-2 break-all font-mono text-[12px] text-fg">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
