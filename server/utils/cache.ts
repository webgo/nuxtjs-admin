/**
 * 缓存工具
 *
 * 所有实际操作委托到 storage.ts，通过 unstorage 统一后端：
 * - REDIS_URL 已设置 → Redis 驱动
 * - REDIS_URL 未设置 → fs 驱动（.data/app_cache/）
 */
import { type StorageValue } from "unstorage";

import {
  getItem,
  setItem,
  removeItem,
  hasItem,
  getKeys,
  clear,
  getMeta,
  getRaw,
} from "./storage";

// ========== 键值操作 ==========

export async function cacheGet(key: string): Promise<unknown | null> {
  return getItem(key);
}

export async function cacheSet(
  key: string,
  value: StorageValue,
  ttl?: number,
): Promise<"OK"> {
  await setItem(key, value, ttl ? { ttl } : undefined);
  return "OK";
}

export async function cacheDel(key: string): Promise<number> {
  await removeItem(key);
  return 1;
}

export async function cacheDelMany(keys: string[]): Promise<number> {
  for (const key of keys) {
    await removeItem(key);
  }
  return keys.length;
}

export async function cacheExists(key: string): Promise<number> {
  return (await hasItem(key)) ? 1 : 0;
}

export async function cacheGetRaw(key: string): Promise<string | null> {
  return getRaw(key);
}

// ========== Key 搜索和元信息 ==========

export async function cacheScan(
  cursor: string | number,
  pattern: string,
  count = 100,
): Promise<{ cursor: string; keys: string[] }> {
  const prefix = pattern.replace(/[*?]/g, "");
  const allKeys = await getKeys(prefix);
  const start = Number(cursor) || 0;
  const keys = allKeys.slice(start, start + count);
  const nextCursor =
    start + count >= allKeys.length ? "0" : String(start + count);
  return { cursor: nextCursor, keys };
}

export async function cacheTtl(key: string): Promise<number> {
  const meta = await getMeta(key);
  return meta.ttl ?? -1;
}

export async function cacheType(_key: string): Promise<string> {
  return "string";
}

// ========== 缓存监控统计 ==========

export async function cacheInfo(): Promise<Record<string, string>> {
  return {
    version: "7.0.0 (unstorage)",
    os: process.platform,
    used_memory_human: "N/A",
    keyspace_hits: "0",
    keyspace_misses: "0",
  };
}

export async function cacheDbSize(): Promise<number> {
  return (await getKeys()).length;
}

export async function cacheFlush(): Promise<"OK"> {
  await clear();
  return "OK";
}

export async function cachePing(): Promise<boolean> {
  try {
    await hasItem("__ping__");
    return true;
  } catch {
    return false;
  }
}

// ========== 数据结构操作（unstorage 下仅 string 类型） ==========

export async function cacheStrlen(key: string): Promise<number> {
  const v = await getRaw(key);
  return v ? v.length : 0;
}
export async function cacheLlen(_key: string): Promise<number> {
  return 0;
}
export async function cacheScard(_key: string): Promise<number> {
  return 0;
}
export async function cacheHlen(_key: string): Promise<number> {
  return 0;
}
export async function cacheZcard(_key: string): Promise<number> {
  return 0;
}
export async function cacheHgetall(
  key: string,
): Promise<Record<string, string>> {
  return (await getItem<Record<string, string>>(key)) ?? {};
}
export async function cacheLrange(
  _key: string,
  _start: number,
  _stop: number,
): Promise<string[]> {
  return [];
}
export async function cacheSmembers(_key: string): Promise<string[]> {
  return [];
}
export async function cacheZrange(
  _key: string,
  _start: number,
  _stop: number,
): Promise<string[]> {
  return [];
}

// ========== 前缀函数（已由 driver base 处理） ==========
export function cacheKey(key: string): string {
  return key;
}

// ========== 旧版 getCache（兼容尚未迁移的调用方过渡） ==========
export function getCache() {
  return {
    setex: async (key: string, ttl: number, value: string) => {
      await setItem(key, value, { ttl });
    },
    set: async (key: string, value: string) => {
      await setItem(key, value);
    },
    get: async (key: string) => getRaw(key),
    del: async (...keys: string[]) => {
      for (const k of keys) await removeItem(k);
      return keys.length;
    },
    exists: async (key: string) => hasItem(key).then((v) => (v ? 1 : 0)),
    mget: async (...keys: string[]) => Promise.all(keys.map((k) => getRaw(k))),
    strlen: async (key: string) => {
      const v = await getRaw(key);
      return v ? v.length : 0;
    },
    llen: async () => 0,
    scard: async () => 0,
    hlen: async () => 0,
    zcard: async () => 0,
    hgetall: async (key: string) =>
      (await getItem<Record<string, string>>(key)) ?? {},
    lrange: async () => [],
    smembers: async () => [],
    zrange: async () => [],
    quit: async () => {},
    on: () => {},
  };
}
