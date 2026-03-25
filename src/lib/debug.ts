const enabled =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('debug')

export function debug(...args: unknown[]): void {
  if (enabled) {
    console.log('[sk-demo]', ...args)
  }
}
