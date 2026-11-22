/**
 * Serves the assembled dist/ like GitHub Pages. Run `pnpm build` first.
 *
 *   node scripts/preview.ts [--port 4173]
 */
import { existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { distDir } from './lib/apps.ts'
import { readStatic, resolveStatic } from './lib/static.ts'

const at = process.argv.indexOf('--port')
const port = Number(at > -1 ? process.argv[at + 1] : 4173)

if (!existsSync(distDir)) {
  console.error('dist/ not found: run `pnpm build` first')
  process.exit(1)
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const hit = await resolveStatic(distDir, url.pathname)
  if (!hit) return void res.writeHead(404).end('Not found')
  if ('redirect' in hit)
    return void res.writeHead(301, { location: hit.redirect + url.search }).end()
  const { body, type } = await readStatic(hit.file)
  // Workers, manifests and pages must not be cached by the browser.
  const noCache = /(sw\.js|workbox-[^/]*\.js|\.webmanifest|\.html)$/.test(hit.file)
  res.writeHead(hit.status, {
    'content-type': type,
    ...(noCache ? { 'cache-control': 'no-cache' } : {}),
  })
  res.end(body)
}).listen(port, () => console.warn(`preview: http://localhost:${port}/`))
