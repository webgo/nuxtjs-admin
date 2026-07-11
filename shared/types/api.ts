// ========== 通用响应类型 ==========
export interface ApiResponse<T = unknown> {
  code: number
  msg?: string
  data: T
}

export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ========== 用户模块 ==========
export interface UserInfo {
  id: number
  username: string
  nickname: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  status: number
  userType: number // 0=普通用户, 1=管理员
}

export interface UserItem extends UserInfo {
  createTime: string
  updateTime: string
  remark?: string
  roles: { id: number; name: string; code: string }[]
}

export interface UserQuery {
  page?: number
  pageSize?: number
  username?: string
  status?: number
}

export interface UserCreateBody {
  username: string
  password: string
  nickname?: string
  email?: string
  phone?: string
  status?: number
  roleIds?: number[]
}

// ========== 角色模块 ==========
export interface RoleItem {
  id: number
  name: string
  code: string
  description: string | null
  status: number
  sort: number
  createTime: string
}

// ========== 权限模块 ==========
export interface PermissionNode {
  id: number
  name: string
  code: string | null
  type: number
  parentId: number | null
  path: string | null
  icon: string | null
  sort: number
  status: number
  visible: number
  children: PermissionNode[]
}

// ========== 字典模块 ==========
export interface DictTypeItem {
  id: number
  name: string
  code: string
  status: number
  createTime: string
}

/** Element Plus el-tag 支持的 type 值 */
export type TagType = 'success' | 'warning' | 'danger' | 'info' | 'primary'

/** 带标签颜色的字典选项 */
export interface DictOption {
  value: string | number
  label: string
  tagType: TagType
  cssClass?: string
}

export interface DictDataItem {
  id: number
  dictTypeId: number
  label: string
  value: string
  sort: number
  status: number
  cssClass?: string
  remark?: string
  createTime?: string
  updateTime?: string
  dictName?: string
  dictCode?: string
}

// ========== 认证模块 ==========
export interface LoginBody {
  username: string
  password: string
}

export interface PortalLoginBody {
  email: string
  password: string
}

export interface PortalRegisterBody {
  username: string
  email: string
  password: string
  nickname?: string
  phone?: string
}

export interface LoginResult {
  token: string
  user: UserInfo
}

export interface PortalLoginResult {
  token: string
  user: UserInfo
}

export interface UserinfoResult {
  user: UserInfo
  roles: string[]
  permissions: string[]
}

export interface MenuNode {
  id: number
  name: string
  code: string | null
  type: number
  path: string | null
  icon: string | null
  sort: number
  visible: number
  children: MenuNode[]
}

// ========== 审计日志模块 ==========
export interface AuditLogItem {
  id: number
  userId: number
  username: string
  action: string
  target: string
  targetId: number | null
  detail: string | null
  ip: string | null
  createTime: string
}

// ========== 通知模块 ==========
export interface NotificationItem {
  id: number
  userId: number
  title: string
  content: string
  type: 'system' | 'approval' | 'reminder'
  isRead: number
  createTime: string
}

// ========== 系统监控 ==========
export interface SystemMonitorData {
  uptime: number
  osUptime: number
  memory: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
    total: number
    free: number
    usagePercent: string
  } | null
  cpu: { cores: number; model: string; arch: string; loadAvg: number[] } | null
  os: { hostname: string; platform: string; release: string } | null
  runtime: { nodeVersion: string; pid: number; cwd: string } | null
  database: { status: string; version: string } | null
}

// ========== 在线用户模块 ==========
export interface OnlineUserItem {
  userId: number
  username: string
  nickname: string | null
  ip: string
  loginTime: string
  token: string
}

// ========== 缓存监控 ==========
export interface CacheInfoData {
  version: string
  uptimeInSeconds: number
  usedMemory: string
  usedMemoryHuman: string
  totalKeys: number
  connectedClients: number
  hitRate: string
  os: string
  arch: string
  tcpPort: number
}

export interface CacheKeyItem {
  key: string
  type: string
  ttl: number
  size: string
}

// ========== 文件模块 ==========
export interface FileRecord {
  id: number
  fileName: string
  storageName: string
  filePath: string
  fileSize: number
  fileType: string | null
  extension: string | null
  module: string | null
  uploadBy: number | null
  status: number
  createTime: string
  updateTime: string
}

// ========== 内容模块 ==========
export interface CategoryItem {
  id: number
  name: string
  code: string
  description: string | null
  sort: number
  status: number
}

export interface ContentItem {
  id: number
  title: string
  thumbnail: string | null
  summary: string | null
  categoryId: number | null
  status: number
  createTime: string
}

// ========== Eats 模块 ==========

// --- 商家分类 ---
export interface MerchantCategoryItem {
  id: number
  name: string
  code: string
  icon?: string
  sort: number
  status: number
}

export interface MerchantCategoryQuery {
  page?: number
  pageSize?: number
  name?: string
  status?: number
}

export interface MerchantCategoryCreateBody {
  name: string
  code: string
  icon?: string
  sort?: number
}

// --- 商家 ---
export interface MerchantItem {
  id: number
  name: string
  code: string
  description?: string
  logo?: string
  coverImage?: string
  categoryId: number
  categoryName?: string
  regionId?: number
  regionName?: string
  contactName?: string
  contactPhone?: string
  address?: string
  longitude?: number
  latitude?: number
  status: number
  level: number
  tags?: string
  deliveryFee?: number
  minOrderAmount?: number
  estimatedDeliveryTime?: number
  openTime?: string
  closeTime?: string
  rating?: number
  ratingCount?: number
  monthlySales?: number
  isFeatured: number
  isNew: number
  remark?: string
  createTime: string
}

export interface MerchantDetail extends MerchantItem {
  categories: ProductCategoryItem[]
  products: ProductItem[]
}

// ========== 地区管理 ==========
export type RegionLevel = 1 | 2 | 3

export interface RegionItem {
  id: number
  name: string
  nameTw?: string
  nameEn?: string
  nameJp?: string
  level: RegionLevel
  parentId?: number
  lang: string
  lng?: number
  lat?: number
  sort: number
  status: number
  remark?: string
  children: RegionItem[]
  createTime: string
}

export interface RegionQuery {
  page?: number
  pageSize?: number
  name?: string
  level?: number
  parentId?: number
  lang?: string
  status?: number
}

export interface RegionCreateBody {
  name: string
  nameTw?: string
  nameEn?: string
  nameJp?: string
  level: RegionLevel
  parentId?: number
  lang: string
  lng?: number
  lat?: number
  sort?: number
  status?: number
  remark?: string
}

// ========== 商家（带地区） ==========
export interface MerchantQuery {
  page?: number
  pageSize?: number
  name?: string
  categoryId?: number
  regionId?: number
  status?: number
  level?: number
  isFeatured?: number
  keyword?: string
  longitude?: number
  latitude?: number
  deliveryType?: string
}

export interface MerchantCreateBody {
  name: string
  code: string
  description?: string
  logo?: string
  coverImage?: string
  categoryId: number
  regionId?: number
  contactName?: string
  contactPhone?: string
  address?: string
  longitude?: number
  latitude?: number
  status?: number
  level?: number
  tags?: string
  deliveryFee?: number
  minOrderAmount?: number
  estimatedDeliveryTime?: number
  openTime?: string
  closeTime?: string
  isFeatured?: number
  isNew?: number
  remark?: string
}

// --- 商品分类 ---
export interface ProductCategoryItem {
  id: number
  name: string
  merchantId: number
  merchantName?: string
  sort: number
  status: number
  remark?: string
}

export interface ProductCategoryQuery {
  page?: number
  pageSize?: number
  merchantId?: number
  name?: string
  status?: number
}

// --- 价格单位 ---
export interface PriceUnitItem {
  id: number
  name: string
  symbol: string
  sort: number
  status: number
}

// --- 商品规格 ---
export interface ProductSpecItem {
  id: number
  productId: number
  name: string
  price: number
  originalPrice?: number
  unitId?: number
  unitName?: string
  unitSymbol?: string
  isDefault: number
  stock?: number
  sort: number
  status: number
}

// --- 商品 ---
export interface ProductItem {
  id: number
  name: string
  code: string
  description?: string
  image?: string
  categoryId?: number
  categoryName?: string
  merchantId: number
  merchantName?: string
  status: number
  sales: number
  unit?: string
  isRecommended: number
  sort: number
  remark?: string
  specs: ProductSpecItem[]
  priceRange?: string
  createTime: string
}

export interface ProductQuery {
  page?: number
  pageSize?: number
  merchantId?: number
  categoryId?: number
  name?: string
  status?: number
  isRecommended?: number
}

export interface ProductCreateBody {
  name: string
  code: string
  description?: string
  image?: string
  categoryId?: number
  merchantId: number
  status?: number
  unit?: string
  isRecommended?: number
  sort?: number
  remark?: string
  specs: Omit<ProductSpecItem, 'id' | 'productId' | 'createTime' | 'updateTime'>[]
}

// --- 订单 ---
export interface OrderItem {
  id: number
  orderNo: string
  merchantId: number
  merchantName?: string
  userId: number
  totalAmount: number
  deliveryFee?: number
  serviceFee?: number
  deliveryType?: string
  status: string
  deliveryAddress?: string
  contactName?: string
  contactPhone?: string
  remark?: string
  paymentMethod?: string
  paymentTime?: string
  items: OrderDetailItem[]
  createTime: string
}

export interface OrderDetailItem {
  id: number
  productId: number
  productName: string
  productImage?: string
  specName?: string
  price: number
  quantity: number
  subtotal: number
}

export interface OrderQuery {
  page?: number
  pageSize?: number
  merchantId?: number
  userId?: number
  status?: string
  orderNo?: string
  deliveryType?: string
}

// --- 购物车 ---
export interface CartItem {
  id: number
  userId: number
  merchantId: number
  merchantName?: string
  productId: number
  productName?: string
  productImage?: string
  specName?: string
  price?: number
  unitName?: string
  unitSymbol?: string
  quantity: number
  createTime: string
}

// --- 评价 ---
export interface RatingItem {
  id: number
  orderId: number
  userId: number
  username?: string
  merchantId: number
  productId?: number
  productName?: string
  rating: number
  content?: string
  images?: string
  createTime: string
}

export interface RatingQuery {
  page?: number
  pageSize?: number
  merchantId?: number
  productId?: number
  rating?: number
}

// ========== 用户地址 ==========
export interface UserAddressItem {
  id: number
  userId: number
  label: string | null
  name: string
  phone: string
  province: string | null
  city: string | null
  district: string | null
  detail: string
  isDefault: number
  createTime: string
  updateTime: string
}

export interface UserAddressCreateBody {
  label?: string
  name: string
  phone: string
  province?: string
  city?: string
  district?: string
  detail: string
  isDefault?: number
}
