import { useState } from 'react'

export function RawJson({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
        {open ? 'hide raw JSON' : 'show raw JSON'}
      </button>
      {open && (
        <pre className="mt-1 max-h-64 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
