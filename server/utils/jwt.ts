import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
  username: string;
  userType: number;
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
  // 根据请求路径决定读取哪个 cookie
  const path = getRequestURL(event).pathname || '';
  if (path.startsWith('/api/portal/')) {
    const portalToken = getCookie(event, "portal_token");
    if (portalToken) return portalToken;
    const adminToken = getCookie(event, "admin_token");
    if (adminToken) return adminToken;
  } else {
    const adminToken = getCookie(event, "admin_token");
    if (adminToken) return adminToken;
    const portalToken = getCookie(event, "portal_token");
    if (portalToken) return portalToken;
  }
  return null;
}
