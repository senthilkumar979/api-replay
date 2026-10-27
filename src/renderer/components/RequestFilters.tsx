import { useAtom } from 'jotai'
import { RESOURCE_TYPE_FILTERS } from '@shared/constants'
import {
  methodFilterAtom,
  searchAtom,
  sortKeyAtom,
  stateFilterAtom,
  statusFilterAtom,
  typeFilterAtom
} from '../state/atoms'

export const RequestFilters = () => {
  const [search, setSearch] = useAtom(searchAtom)
  const [method, setMethod] = useAtom(methodFilterAtom)
  const [type, setType] = useAtom(typeFilterAtom)
  const [status, setStatus] = useAtom(statusFilterAtom)
  const [state, setState] = useAtom(stateFilterAtom)
  const [sortKey, setSortKey] = useAtom(sortKeyAtom)

  return (
    <div className="flex flex-wrap gap-2 border-b border-line bg-surface p-2">
      <input
        data-testid="capture-search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search URL or path"
        className="h-7 min-w-48 flex-1 rounded-md border border-line bg-ink px-2 text-[13px] text-fg outline-none placeholder:text-fg-subtle focus:border-accent"
      />
      <select value={method} onChange={(event) => setMethod(event.target.value)} className="filter-select">
        <option value="all">All methods</option>
        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select
        data-testid="type-filter"
        value={type}
        onChange={(event) => setType(event.target.value)}
        className="filter-select"
      >
        <option value="all">All types</option>
        {RESOURCE_TYPE_FILTERS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select value={status} onChange={(event) => setStatus(event.target.value)} className="filter-select">
        <option value="all">All statuses</option>
        <option value="success">2xx/3xx</option>
        <option value="failed">4xx/5xx</option>
      </select>
      <select value={state} onChange={(event) => setState(event.target.value)} className="filter-select">
        <option value="all">All APIs</option>
        <option value="saved">Saved</option>
        <option value="unsaved">Unsaved</option>
        <option value="mocked">Mocked</option>
      </select>
      <select
        value={sortKey}
        onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
        className="filter-select"
      >
        <option value="recent">Recent</option>
        <option value="duration">Duration</option>
        <option value="status">Status</option>
        <option value="url">URL</option>
      </select>
    </div>
  )
}
