import { describe, it, expect } from 'vitest'
import { ApiError, getPaginationParams } from '@/lib/api-utils'

describe('ApiError', () => {
  it('creates error with status code and message', () => {
    const error = new ApiError(404, 'Not found')
    expect(error.statusCode).toBe(404)
    expect(error.message).toBe('Not found')
    expect(error.name).toBe('ApiError')
  })

  it('is an instance of Error', () => {
    const error = new ApiError(500, 'Server error')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
  })

  it('has correct stack trace', () => {
    const error = new ApiError(400, 'Bad request')
    expect(error.stack).toBeDefined()
  })
})

describe('getPaginationParams', () => {
  it('returns defaults for empty params', () => {
    const params = new URLSearchParams()
    const result = getPaginationParams(params)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(12)
    expect(result.skip).toBe(0)
  })

  it('calculates skip correctly', () => {
    const params = new URLSearchParams({ page: '3', limit: '10' })
    const result = getPaginationParams(params)
    expect(result.page).toBe(3)
    expect(result.limit).toBe(10)
    expect(result.skip).toBe(20)
  })

  it('clamps page to minimum 1', () => {
    const params = new URLSearchParams({ page: '-5' })
    const result = getPaginationParams(params)
    expect(result.page).toBe(1)
  })

  it('clamps limit to maximum 100', () => {
    const params = new URLSearchParams({ limit: '500' })
    const result = getPaginationParams(params)
    expect(result.limit).toBe(100)
  })

  it('clamps limit to minimum 1', () => {
    const params = new URLSearchParams({ limit: '0' })
    const result = getPaginationParams(params)
    expect(result.limit).toBe(1)
  })

  it('handles NaN values gracefully', () => {
    const params = new URLSearchParams({ page: 'abc', limit: 'xyz' })
    const result = getPaginationParams(params)
    // NaN gets clamped by Math.max
    expect(result.page).toBeGreaterThanOrEqual(1)
    expect(result.limit).toBeGreaterThanOrEqual(1)
  })
})
