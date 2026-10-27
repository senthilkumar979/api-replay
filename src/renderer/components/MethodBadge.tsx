import { methodTone } from '../theme/tones'

interface MethodBadgeProps {
  method: string
}

export const MethodBadge = ({ method }: MethodBadgeProps) => (
  <span className={`font-mono text-[11px] font-semibold tracking-wide ${methodTone(method)}`}>{method}</span>
)
