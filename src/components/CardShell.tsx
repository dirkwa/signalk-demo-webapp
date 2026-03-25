import type { ReactNode } from 'react'
import { StatusBadge, type CardStatus } from './StatusBadge.tsx'

interface CardShellProps {
  title: string
  sourceFile: string
  apiPaths: string[]
  status: CardStatus
  children: ReactNode
}

const GITHUB_BASE = 'https://github.com/SignalK/signalk-demo-webapp/blob/main/'

export function CardShell({ title, sourceFile, apiPaths, status, children }: CardShellProps) {
  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <a
            href={`${GITHUB_BASE}${sourceFile}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            {sourceFile}
          </a>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {apiPaths.map((p) => (
          <code key={p} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
            {p}
          </code>
        ))}
      </div>

      <div className="relative">
        {children}

        {status === 'unauthenticated' && (
          <div className="absolute inset-0 flex items-center justify-center rounded bg-gray-100/80">
            <span className="text-sm font-medium text-gray-500">Login required</span>
          </div>
        )}

        {status === 'unavailable' && (
          <div className="absolute inset-0 flex items-center justify-center rounded bg-gray-100/80">
            <span className="text-sm font-medium text-gray-500">
              Feature not available on this server version
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
