/**
 * 缓存工具
 *
 * 对 storage.ts 的高层封装，提供缓存读写与监控的统一函数签名。
 *
 * 底层通过 unstorage 统一后端：
 * - REDIS_URL 已设置 → Redis 驱动（原生 TTL 支持）
 * - REDIS_URL 未设置 → fs 驱动（持久化到 .data/app_cache/）
 *
 * 调用方无需感知底层实现，直接使用本模块导出的函数即可。
 * 缓存监控 API（server/api/system/cache/*）的场景推荐优先使用本模块。
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

// ========== 基础操作 ==========

/** 获取 key 的值（自动 JSON 反序列化） */
export async function cacheGet<T extends StorageValue = StorageValue>(key: string): Promise<T | null> {
  return getItem<T>(key);
}

/** 写入 key 的值（自动 JSON 序列化），可选 TTL */
export async function cacheSet(
  key: string,
  value: StorageValue,
  ttl?: number,
): Promise<"OK"> {
  await setItem(key, value, ttl ? { ttl } : undefined);
  return "OK";
}

/** 批量删除 key */
export async function cacheDelMany(keys: string[]): Promise<number> {
  for (const key of keys) {
    await removeItem(key);
  }
  return keys.length;
}

/** 检查缓存服务是否可用 */
export async function cachePing(): Promise<boolean> {
  try {
    await hasItem("__ping__");
    return true;
  } catch {
    return false;
  }
}

/** 检查 key 是否存在（返回 1 存在 / 0 不存在，兼容 ioredis exists 签名） */
export async function cacheExists(key: string): Promise<number> {
  return (await hasItem(key)) ? 1 : 0;
}

/** 删除单个 key */
export async function cacheDel(key: string): Promise<number> {
  await removeItem(key);
  return 1;
}

/** 获取 key 的原始字符串值（不经过 JSON 反序列化） */
export async function cacheGetRaw(key: string): Promise<string | null> {
  return getRaw(key);
}

// ========== Key 搜索与元信息 ==========

/**
 * 分页扫描 key（模拟 Redis SCAN）
 * @param cursor 游标（首次传 "0"）
 * @param pattern 匹配模式，如 "online_user:*"
 * @param count 每批数量
 * @returns 游标和 key 列表（游标为 "0" 表示已遍历完）
 */
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

/** 获取 key 的剩余生存时间（秒），-1 表示永不过期 */
export async function cacheTtl(key: string): Promise<number> {
  const meta = await getMeta(key);
  return meta.ttl ?? -1;
}

/**
 * 获取 key 的类型
 * 注意：unstorage 下所有值均以 string 存储，因此始终返回 "string"
 */
export async function cacheType(_key: string): Promise<string> {
  return "string";
}

// ========== 数据结构操作 ==========
/**
 * 以下方法适配缓存监控页面对不同数据类型的查询。
 * unstorage 统一以 string 存储，非 string 类型仅返回空值。
 */

/** 获取 string 类型值的字节长度 */
export async function cacheStrlen(key: string): Promise<number> {
  const v = await getRaw(key);
  return v ? v.length : 0;
}

/** 获取 list 长度（unstorage 下始终返回 0） */
export async function cacheLlen(_key: string): Promise<number> {
  return 0;
}

/** 获取 set 基数（unstorage 下始终返回 0） */
export async function cacheScard(_key: string): Promise<number> {
  return 0;
}

/** 获取 hash 字段数（unstorage 下始终返回 0） */
export async function cacheHlen(_key: string): Promise<number> {
  return 0;
}

/** 获取 zset 基数（unstorage 下始终返回 0） */
export async function cacheZcard(_key: string): Promise<number> {
  return 0;
}

/** 获取 hash 所有字段（按普通对象读取） */
export async function cacheHgetall(
  key: string,
): Promise<Record<string, string>> {
  return (await getItem<Record<string, string>>(key)) ?? {};
}

// ========== 缓存监控统计 ==========

/** 获取缓存服务概览信息（兼容 Redis INFO 返回格式） */
export async function cacheInfo(): Promise<Record<string, string>> {
  return {
    version: "7.0.0 (unstorage)",
    os: process.platform,
    used_memory_human: "N/A",
    keyspace_hits: "0",
    keyspace_misses: "0",
  };
}

/** 获取当前缓存 key 总数 */
export async function cacheDbSize(): Promise<number> {
  return (await getKeys()).length;
}

/** 清空所有缓存 */
export async function cacheFlush(): Promise<"OK"> {
  await clear();
  return "OK";
}

// ========== Key 前缀处理 ==========

/**
 * 补全 key 前缀
 * 已由 driver base 自动处理（Redis 驱动自动加前缀，fs 驱动自动映射目录），
 * 此函数保留仅用于统一接口。
 */
export function cacheKey(key: string): string {
  return key;
}

