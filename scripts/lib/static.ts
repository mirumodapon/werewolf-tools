import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

export const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

const isFile = (p: string) =>
  stat(p).then(
    (s) => s.isFile(),
    () => false,
  )

/**
 * Resolves a URL path the way GitHub Pages does: the file, a folder's index.html (with a
 * redirect to the trailing slash), `<path>.html` for clean URLs, else 404.html.
 */
export async function resolveStatic(
  dir: string,
  pathname: string,
): Promise<{ file: string; status: number } | { redirect: string } | null> {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  const target = join(dir, rel)
  if (!target.startsWith(dir)) return null
  if (await isFile(target)) return { file: target, status: 200 }
  if (await isFile(join(target, 'index.html')))
    return pathname.endsWith('/')
      ? { file: join(target, 'index.html'), status: 200 }
      : { redirect: `${pathname}/` }
  if (!pathname.endsWith('/') && (await isFile(`${target}.html`)))
    return { file: `${target}.html`, status: 200 }
  const notFound = join(dir, '404.html')
  return (await isFile(notFound)) ? { file: notFound, status: 404 } : null
}

export async function readStatic(file: string): Promise<{ body: Buffer; type: string }> {
  return { body: await readFile(file), type: MIME[extname(file)] ?? 'application/octet-stream' }
}
