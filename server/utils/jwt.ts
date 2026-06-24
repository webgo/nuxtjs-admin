import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
  username: string;
}

const getSecret = () => {
  const config = useRuntimeConfig();
  return config.jwtSecret as string;
};

export function signToken(payload: JwtPayload) {
  const config = useRuntimeConfig();
  return jwt.sign(payload, getSecret(), {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeader(event: any): string | null {
  // 优先从 Authorization header 读取
  const authHeader = getHeader(event, "authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  // 降级：从 cookie 读取
  const cookieToken = getCookie(event, "token");
  if (cookieToken) {
    return cookieToken;
  }
  return null;
}
