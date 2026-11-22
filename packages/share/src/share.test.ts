import { describe, expect, it } from 'vite-plus/test'
import {
  decodePayload,
  encodePayload,
  fromBase64Url,
  shareUrl,
  ShareError,
  takeQueryParam,
  toBase64Url,
} from './index.ts'

describe('share', () => {
  it('round-trips values', async () => {
    const value = [1, '12 人預女獵守', [4, 0, 1]]
    const payload = await encodePayload(value)
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(await decodePayload(payload)).toEqual(value)
  })

  it('picks the shorter of plain and compressed', async () => {
    expect((await encodePayload([1, 2])).startsWith('j')).toBe(true)
    const big = Array.from({ length: 200 }, () => 'werewolf')
    const packed = await encodePayload(big)
    expect(packed.startsWith('z')).toBe(true)
    expect(await decodePayload(packed)).toEqual(big)
  })

  it('rejects broken payloads', async () => {
    await expect(decodePayload('not valid!')).rejects.toBeInstanceOf(ShareError)
    await expect(decodePayload('zAAAA')).rejects.toBeInstanceOf(ShareError)
    await expect(decodePayload('xAAAA')).rejects.toBeInstanceOf(ShareError)
  })

  it('encodes base64url without padding', () => {
    expect(toBase64Url(new Uint8Array([251, 255]))).toBe('-_8')
    expect([...fromBase64Url('-_8')]).toEqual([251, 255])
  })

  it('builds the link and takes the parameter back out', () => {
    expect(shareUrl('https://x.test/deal/?a=1#/boards', 'b', 'abc')).toBe(
      'https://x.test/deal/?b=abc',
    )
    history.replaceState(null, '', '/judge/?s=xyz&keep=1#/list')
    expect(takeQueryParam('s')).toBe('xyz')
    expect(location.search).toBe('?keep=1')
    expect(location.hash).toBe('#/list')
    expect(takeQueryParam('s')).toBeNull()
  })
})
