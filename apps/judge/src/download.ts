/** Saves text or a blob as a file (a download link the browser clicks for us). */
export function download(name: string, content: string | Blob, type = 'application/json'): void {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
