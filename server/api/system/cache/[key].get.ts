import {
  cacheGetRaw,
  cacheTtl,
  cacheType,
  cacheExists,
  cacheHgetall,
} from "../../../utils/cache";

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, "key");
  if (!key) {
    throw createError({ statusCode: 400, message: "缺少 key" });
  }

  try {
    const exists = await cacheExists(key);
    if (!exists) {
      throw createError({ statusCode: 404, message: "Key 不存在" });
    }

    const [type, ttl, value] = await Promise.all([
      cacheType(key),
      cacheTtl(key),
      cacheGetRaw(key),
    ]);

    // 对特定类型尝试获取更多信息
    let detail: unknown = value;
    if (type === "hash") {
      detail = await cacheHgetall(key);
    }

    // 尝试 JSON 美化显示
    let displayValue = value;
    if (value) {
      try {
        const parsed = JSON.parse(value);
        displayValue = JSON.stringify(parsed, null, 2);
      } catch {
        // 非 JSON 字符串保持原样
      }
    }

    return {
      code: 200,
      data: {
        key,
        type,
        ttl: ttl >= 0 ? ttl : -1,
        value: displayValue,
        detail,
      },
    };
  } catch (err: unknown) {
    // 缓存不可用或 key 不存在 —— 已是 404 直接抛，其他情况降级
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    throw createError({ statusCode: 503, message: "缓存服务不可用" });
  }
});
