export type CardStatus = 'ok' | 'error' | 'unauthenticated' | 'unavailable'

const styles: Record<CardStatus, string> = {
  ok: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  unauthenticated: 'bg-yellow-100 text-yellow-800',
  unavailable: 'bg-gray-100 text-gray-500',
}

const labels: Record<CardStatus, string> = {
  ok: 'Connected',
  error: 'Error',
  unauthenticated: 'Login required',
  unavailable: 'Unavailable',
}

export function StatusBadge({ status }: { status: CardStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
