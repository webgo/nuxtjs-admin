import { describe, it, expect } from 'vitest'

describe('useRequest', () => {
  it('should export useRequest function', async () => {
    const mod = await import('../app/composables/useRequest')
    expect(typeof mod.useRequest).toBe('function')
  })

  it('returned object should have expected properties', async () => {
    const { useRequest } = await import('../app/composables/useRequest')
    const result = useRequest()
    expect(result).toHaveProperty('loading')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('get')
    expect(result).toHaveProperty('post')
    expect(result).toHaveProperty('put')
    expect(result).toHaveProperty('del')
  })
})
