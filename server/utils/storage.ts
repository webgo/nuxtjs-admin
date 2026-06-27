import { createStorage, type StorageValue } from 'unstorage'
import redisDriver from 'unstorage/drivers/redis'
import fsDriver from 'unstorage/drivers/fs'

/**
 * 基于 unstorage 的统一持久化抽象
 *
 * 自动根据环境选择后端驱动：
 * - REDIS_URL 已设置 → Redis 驱动（原生 TTL 支持）
 * - REDIS_URL 未设置 → fs 驱动（持久化到 .data/app_cache/）
 *
 * 调用方无需感知底层实现，所有 key 都以逻辑名传入即可，
 * driver 的 base 选项会自动处理前缀（Redis 的 key prefix / fs 的目录）。
 */
const storage = createStorage({
  driver: process.env.REDIS_URL
    ? redisDriver({ url: process.env.REDIS_URL, base: 'nuxtjsadmin' })
    : fsDriver({ base: './.data/app_cache' }),
})

export async function getItem<T extends StorageValue = StorageValue>(key: string): Promise<T | null> {
  return storage.getItem<T>(key)
}

export async function setItem<T extends StorageValue = StorageValue>(key: string, value: T, opts?: { ttl?: number }): Promise<void> {
  await storage.setItem(key, value, opts)
}

export async function removeItem(key: string): Promise<void> {
  await storage.removeItem(key)
}

export async function hasItem(key: string): Promise<boolean> {
  return storage.hasItem(key)
}

/**
 * 获取 key 列表，可选前缀过滤
 * @param prefix 前缀过滤，如 'online_user:' → 只返回 online_user: 开头的 key
 */
export async function getKeys(prefix?: string): Promise<string[]> {
  return storage.getKeys(prefix)
}

/** 清空所有 key（对应 Redis FLUSHDB / fs 清空目录） */
export async function clear(): Promise<void> {
  await storage.clear()
}

/** 获取 key 的元信息（TTL 等） */
export async function getMeta(key: string): Promise<{ ttl?: number }> {
  return storage.getMeta(key)
}

/** 获取原始值（不经过 JSON 反序列化） */
export async function getRaw(key: string): Promise<string | null> {
  return storage.getItemRaw(key)
}
