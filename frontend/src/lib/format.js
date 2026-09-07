/** Shared formatting helpers for durations, timestamps and git metadata. */

/** "1.4s" / "2m 12s" — used for step and build durations. */
export function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms) || ms < 0) return null
  if (ms < 1000) return `${ms}ms`

  const totalSeconds = ms / 1000
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  if (minutes < 60) return `${minutes}m ${seconds}s`

  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

/** Duration between two ISO timestamps, tolerating either being absent. */
export function durationBetween(start, end) {
  if (!start || !end) return null
  return formatDuration(new Date(end) - new Date(start))
}

/** "just now" / "4m ago" / "3d ago" — relative time for lists. */
export function timeAgo(date) {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)

  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Wall-clock time for the log gutter — HH:MM:SS, no date. */
export function logTime(ts) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '--:--:--'
  return d.toLocaleTimeString('en-GB', { hour12: false })
}

export function shortSha(hash) {
  return hash ? String(hash).slice(0, 7) : null
}

/** "owner/repo" from a GitHub URL, falling back to the raw string. */
export function repoSlug(repoUrl) {
  if (!repoUrl) return ''
  const match = repoUrl.match(/github\.com[/:]([^/]+\/[^/.]+)/)
  return match ? match[1] : repoUrl.replace(/^https?:\/\//, '')
}

/** First line only — commit bodies would break single-line layouts. */
export function commitSubject(message) {
  if (!message) return null
  return message.split('\n')[0].trim()
}
