import { mysqlTable, mysqlSchema, primaryKey, varchar, datetime, text, int, tinyint, foreignKey, unique, decimal, double, index } from "drizzle-orm/mysql-core"
import type { AnyMySqlColumn } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const prismaMigrations = mysqlTable("_prisma_migrations", {
	id: varchar({ length: 36 }).notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: datetime("finished_at", { mode: 'string', fsp: 3 }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: datetime("rolled_back_at", { mode: 'string', fsp: 3 }),
	startedAt: datetime("started_at", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	appliedStepsCount: int("applied_steps_count", { unsigned: true }).default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "_prisma_migrations_id"}),
]);

export const sysAuditLog = mysqlTable("sys_audit_log", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	username: varchar({ length: 50 }).notNull(),
	action: varchar({ length: 50 }).notNull(),
	target: varchar({ length: 50 }).notNull(),
	targetId: int("target_id"),
	detail: text(),
	ip: varchar({ length: 50 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_audit_log_id"}),
]);

export const sysCart = mysqlTable("sys_cart", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	merchantId: int("merchant_id").notNull().references(() => sysMerchant.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	productId: int("product_id").notNull().references(() => sysProduct.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	specName: varchar("spec_name", { length: 50 }),
	quantity: int().default(1).notNull(),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_cart_id"}),
]);

export const sysCategory = mysqlTable("sys_category", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	description: varchar({ length: 255 }),
	sort: int().default(0).notNull(),
	status: int().default(1).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_category_id"}),
	unique("sys_category_code_key").on(table.code),
]);

export const sysContent = mysqlTable("sys_content", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 200 }).notNull(),
	thumbnail: varchar({ length: 500 }),
	summary: text(),
	content: text(),
	categoryId: int("category_id").references(() => sysCategory.id, { onDelete: "set null", onUpdate: "cascade" } ),
	isRecommended: int("is_recommended").default(0).notNull(),
	status: int().default(1).notNull(),
	clickCount: int("click_count").default(0).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_content_id"}),
]);

export const sysDictData = mysqlTable("sys_dict_data", {
	id: int().autoincrement().notNull(),
	dictTypeId: int("dict_type_id").notNull().references(() => sysDictType.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	label: varchar({ length: 100 }).notNull(),
	value: varchar({ length: 100 }).notNull(),
	sort: int().default(0).notNull(),
	status: int().default(1).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
	cssClass: varchar("css_class", { length: 191 }).default('').notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_dict_data_id"}),
]);

export const sysDictType = mysqlTable("sys_dict_type", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	status: int().default(1).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_dict_type_id"}),
	unique("sys_dict_type_code_key").on(table.code),
]);

export const sysFile = mysqlTable("sys_file", {
	id: int().autoincrement().notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	storageName: varchar("storage_name", { length: 255 }).notNull(),
	filePath: varchar("file_path", { length: 500 }).notNull(),
	fileSize: int("file_size").notNull(),
	fileType: varchar("file_type", { length: 100 }),
	extension: varchar({ length: 20 }),
	module: varchar({ length: 50 }),
	uploadBy: int("upload_by"),
	status: int().default(1).notNull(),
	storageType: varchar("storage_type", { length: 20 }).default('local').notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_file_id"}),
	unique("sys_file_storage_name_key").on(table.storageName),
]);

export const sysLanguage = mysqlTable("sys_language", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 20 }).notNull(),
	isDefault: tinyint("is_default").default(0).notNull(),
	sort: int().default(0).notNull(),
	status: int().default(1).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_language_id"}),
	unique("sys_language_code_key").on(table.code),
]);

export const sysMerchant = mysqlTable("sys_merchant", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	description: text(),
	logo: varchar({ length: 500 }),
	coverImage: varchar("cover_image", { length: 500 }),
	categoryId: int("category_id").notNull().references(() => sysMerchantCategory.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	contactName: varchar("contact_name", { length: 50 }),
	contactPhone: varchar("contact_phone", { length: 20 }),
	address: varchar({ length: 255 }),
	longitude: decimal({ precision: 10, scale: 7 }),
	latitude: decimal({ precision: 10, scale: 7 }),
	status: int().default(1).notNull(),
	level: int().default(0).notNull(),
	tags: text(),
	deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }),
	minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
	estimatedDeliveryTime: int("estimated_delivery_time"),
	openTime: varchar("open_time", { length: 10 }),
	closeTime: varchar("close_time", { length: 10 }),
	rating: decimal({ precision: 2, scale: 1 }),
	ratingCount: int("rating_count"),
	monthlySales: int("monthly_sales"),
	isFeatured: int("is_featured").default(0).notNull(),
	isNew: int("is_new").default(0).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
	regionId: int("region_id").references(() => sysRegion.id, { onDelete: "set null", onUpdate: "cascade" } ),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_merchant_id"}),
	unique("sys_merchant_code_key").on(table.code),
]);

export const sysMerchantCategory = mysqlTable("sys_merchant_category", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	icon: varchar({ length: 255 }),
	sort: int().default(0).notNull(),
	status: int().default(1).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_merchant_category_id"}),
	unique("sys_merchant_category_code_key").on(table.code),
]);

export const sysNotification = mysqlTable("sys_notification", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text(),
	type: varchar({ length: 30 }).default('system').notNull(),
	isRead: int("is_read").default(0).notNull(),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_notification_id"}),
]);

export const sysOrder = mysqlTable("sys_order", {
	id: int().autoincrement().notNull(),
	orderNo: varchar("order_no", { length: 30 }).notNull(),
	merchantId: int("merchant_id").notNull().references(() => sysMerchant.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	userId: int("user_id").notNull(),
	totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
	deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }),
	serviceFee: decimal("service_fee", { precision: 10, scale: 2 }),
	deliveryType: varchar("delivery_type", { length: 10 }),
	status: varchar({ length: 20 }).default('pending').notNull(),
	deliveryAddress: varchar("delivery_address", { length: 255 }),
	contactName: varchar("contact_name", { length: 50 }),
	contactPhone: varchar("contact_phone", { length: 20 }),
	remark: varchar({ length: 500 }),
	paymentMethod: varchar("payment_method", { length: 20 }),
	paymentTime: datetime("payment_time", { mode: 'string', fsp: 3 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_order_id"}),
	unique("sys_order_order_no_key").on(table.orderNo),
]);

export const sysOrderItem = mysqlTable("sys_order_item", {
	id: int().autoincrement().notNull(),
	orderId: int("order_id").notNull().references(() => sysOrder.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	productId: int("product_id").notNull().references(() => sysProduct.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	productName: varchar("product_name", { length: 100 }).notNull(),
	productImage: varchar("product_image", { length: 500 }),
	specName: varchar("spec_name", { length: 50 }),
	price: decimal({ precision: 10, scale: 2 }).notNull(),
	quantity: int().notNull(),
	subtotal: decimal({ precision: 10, scale: 2 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_order_item_id"}),
]);

export const sysPermission = mysqlTable("sys_permission", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 100 }),
	type: int().default(1).notNull(),
	parentId: int("parent_id").default(0),
	path: varchar({ length: 255 }),
	component: varchar({ length: 255 }),
	icon: varchar({ length: 50 }),
	sort: int().default(0).notNull(),
	status: int().default(1).notNull(),
	visible: int().default(1).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_permission_id"}),
]);

export const sysPriceUnit = mysqlTable("sys_price_unit", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	symbol: varchar({ length: 10 }).notNull(),
	sort: int().default(0).notNull(),
	status: int().default(1).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_price_unit_id"}),
]);

export const sysProduct = mysqlTable("sys_product", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	description: text(),
	image: varchar({ length: 500 }),
	categoryId: int("category_id").references(() => sysProductCategory.id, { onDelete: "set null", onUpdate: "cascade" } ),
	merchantId: int("merchant_id").notNull().references(() => sysMerchant.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	status: int().default(1).notNull(),
	sales: int().default(0).notNull(),
	unit: varchar({ length: 10 }),
	isRecommended: int("is_recommended").default(0).notNull(),
	sort: int().default(0).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_product_id"}),
	unique("sys_product_code_key").on(table.code),
]);

export const sysProductCategory = mysqlTable("sys_product_category", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	merchantId: int("merchant_id").notNull().references(() => sysMerchant.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	sort: int().default(0).notNull(),
	status: int().default(1).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_product_category_id"}),
]);

export const sysProductSpec = mysqlTable("sys_product_spec", {
	id: int().autoincrement().notNull(),
	productId: int("product_id").notNull().references(() => sysProduct.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	name: varchar({ length: 50 }).notNull(),
	price: decimal({ precision: 10, scale: 2 }).notNull(),
	originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
	isDefault: int("is_default").default(0).notNull(),
	stock: int().default(0),
	sort: int().default(0).notNull(),
	status: int().default(1).notNull(),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
	unitId: int("unit_id").references(() => sysPriceUnit.id, { onDelete: "set null", onUpdate: "cascade" } ),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_product_spec_id"}),
]);

export const sysRating = mysqlTable("sys_rating", {
	id: int().autoincrement().notNull(),
	orderId: int("order_id").notNull(),
	userId: int("user_id").notNull(),
	merchantId: int("merchant_id").notNull().references(() => sysMerchant.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	productId: int("product_id").references(() => sysProduct.id, { onDelete: "set null", onUpdate: "cascade" } ),
	rating: int().notNull(),
	content: text(),
	images: text(),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_rating_id"}),
	unique("sys_rating_order_id_key").on(table.orderId),
]);

export const sysRegion = mysqlTable("sys_region", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	nameTw: varchar({ length: 100 }),
	nameEn: varchar({ length: 100 }),
	nameJp: varchar({ length: 100 }),
	level: int().notNull(),
	parentId: int("parent_id"),
	lang: varchar({ length: 5 }).default('tw').notNull(),
	lng: double(),
	lat: double(),
	sort: int().default(0).notNull(),
	status: int().default(1).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "sys_region_parent_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	primaryKey({ columns: [table.id], name: "sys_region_id"}),
]);

export const sysRole = mysqlTable("sys_role", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	description: varchar({ length: 255 }),
	status: int().default(1).notNull(),
	sort: int().default(0).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_role_id"}),
	unique("sys_role_code_key").on(table.code),
]);

export const sysRolePermission = mysqlTable("sys_role_permission", {
	roleId: int("role_id").notNull().references(() => sysRole.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	permissionId: int("permission_id").notNull().references(() => sysPermission.id, { onDelete: "cascade", onUpdate: "cascade" } ),
},
(table) => [
	primaryKey({ columns: [table.roleId, table.permissionId], name: "sys_role_permission_role_id_permission_id"}),
]);

export const sysTranslation = mysqlTable("sys_translation", {
	id: int().autoincrement().notNull(),
	namespace: varchar({ length: 50 }).notNull(),
	key: varchar({ length: 100 }).notNull(),
	locale: varchar({ length: 10 }).notNull().references(() => sysLanguage.code, { onDelete: "restrict", onUpdate: "cascade" } ),
	value: varchar({ length: 2000 }).notNull(),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	index("sys_translation_locale_idx").on(table.locale),
	index("sys_translation_namespace_idx").on(table.namespace),
	primaryKey({ columns: [table.id], name: "sys_translation_id"}),
	unique("sys_translation_namespace_key_locale_key").on(table.namespace, table.key, table.locale),
]);

export const sysUser = mysqlTable("sys_user", {
	id: int().autoincrement().notNull(),
	username: varchar({ length: 50 }).notNull(),
	password: varchar({ length: 100 }).notNull(),
	nickname: varchar({ length: 50 }),
	email: varchar({ length: 100 }),
	phone: varchar({ length: 20 }),
	avatar: varchar({ length: 255 }),
	status: int().default(1).notNull(),
	remark: varchar({ length: 500 }),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
	userType: int().default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sys_user_id"}),
	unique("sys_user_username_key").on(table.username),
]);

export const sysUserAddress = mysqlTable("sys_user_address", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => sysUser.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	label: varchar({ length: 20 }),
	name: varchar({ length: 50 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	province: varchar({ length: 50 }),
	city: varchar({ length: 50 }),
	district: varchar({ length: 50 }),
	detail: varchar({ length: 255 }).notNull(),
	isDefault: int("is_default").default(0).notNull(),
	createTime: datetime("create_time", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	updateTime: datetime("update_time", { mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	index("sys_user_address_user_id_idx").on(table.userId),
	primaryKey({ columns: [table.id], name: "sys_user_address_id"}),
]);

export const sysUserMenu = mysqlTable("sys_user_menu", {
	userId: int("user_id").notNull().references(() => sysUser.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	permissionId: int("permission_id").notNull().references(() => sysPermission.id, { onDelete: "cascade", onUpdate: "cascade" } ),
},
(table) => [
	primaryKey({ columns: [table.userId, table.permissionId], name: "sys_user_menu_user_id_permission_id"}),
]);

export const sysUserRole = mysqlTable("sys_user_role", {
	userId: int("user_id").notNull().references(() => sysUser.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	roleId: int("role_id").notNull().references(() => sysRole.id, { onDelete: "cascade", onUpdate: "cascade" } ),
},
(table) => [
	primaryKey({ columns: [table.userId, table.roleId], name: "sys_user_role_user_id_role_id"}),
]);
