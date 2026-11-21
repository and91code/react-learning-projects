import { describe, expect, it } from 'vitest'
import { formatDuration } from './index'

describe('formatDuration', () => {
  it.each([
    [0, '00:00'],
    [60, '01:00'],
    [75, '01:15'],
    [1200, '20:00'],
  ])('formata %i segundos como %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })
})
