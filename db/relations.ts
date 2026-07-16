import { relations } from "drizzle-orm/relations";
import { sysMerchant, sysCart, sysProduct, sysCategory, sysContent, sysDictType, sysDictData, sysMerchantCategory, sysRegion, sysOrder, sysOrderItem, sysProductCategory, sysProductSpec, sysPriceUnit, sysRating, sysPermission, sysRolePermission, sysRole, sysLanguage, sysTranslation, sysUser, sysUserAddress, sysUserMenu, sysUserRole } from "./schema";

export const sysCartRelations = relations(sysCart, ({one}) => ({
	sysMerchant: one(sysMerchant, {
		fields: [sysCart.merchantId],
		references: [sysMerchant.id]
	}),
	sysProduct: one(sysProduct, {
		fields: [sysCart.productId],
		references: [sysProduct.id]
	}),
}));

export const sysMerchantRelations = relations(sysMerchant, ({one, many}) => ({
	sysCarts: many(sysCart),
	sysMerchantCategory: one(sysMerchantCategory, {
		fields: [sysMerchant.categoryId],
		references: [sysMerchantCategory.id]
	}),
	sysRegion: one(sysRegion, {
		fields: [sysMerchant.regionId],
		references: [sysRegion.id]
	}),
	sysOrders: many(sysOrder),
	sysProducts: many(sysProduct),
	sysProductCategories: many(sysProductCategory),
	sysRatings: many(sysRating),
}));

export const sysProductRelations = relations(sysProduct, ({one, many}) => ({
	sysCarts: many(sysCart),
	sysOrderItems: many(sysOrderItem),
	sysProductCategory: one(sysProductCategory, {
		fields: [sysProduct.categoryId],
		references: [sysProductCategory.id]
	}),
	sysMerchant: one(sysMerchant, {
		fields: [sysProduct.merchantId],
		references: [sysMerchant.id]
	}),
	sysProductSpecs: many(sysProductSpec),
	sysRatings: many(sysRating),
}));

export const sysContentRelations = relations(sysContent, ({one}) => ({
	sysCategory: one(sysCategory, {
		fields: [sysContent.categoryId],
		references: [sysCategory.id]
	}),
}));

export const sysCategoryRelations = relations(sysCategory, ({many}) => ({
	sysContents: many(sysContent),
}));

export const sysDictDataRelations = relations(sysDictData, ({one}) => ({
	sysDictType: one(sysDictType, {
		fields: [sysDictData.dictTypeId],
		references: [sysDictType.id]
	}),
}));

export const sysDictTypeRelations = relations(sysDictType, ({many}) => ({
	sysDictData: many(sysDictData),
}));

export const sysMerchantCategoryRelations = relations(sysMerchantCategory, ({many}) => ({
	sysMerchants: many(sysMerchant),
}));

export const sysRegionRelations = relations(sysRegion, ({one, many}) => ({
	sysMerchants: many(sysMerchant),
	sysRegion: one(sysRegion, {
		fields: [sysRegion.parentId],
		references: [sysRegion.id],
		relationName: "sysRegion_parentId_sysRegion_id"
	}),
	sysRegions: many(sysRegion, {
		relationName: "sysRegion_parentId_sysRegion_id"
	}),
}));

export const sysOrderRelations = relations(sysOrder, ({one, many}) => ({
	sysMerchant: one(sysMerchant, {
		fields: [sysOrder.merchantId],
		references: [sysMerchant.id]
	}),
	sysOrderItems: many(sysOrderItem),
}));

export const sysOrderItemRelations = relations(sysOrderItem, ({one}) => ({
	sysOrder: one(sysOrder, {
		fields: [sysOrderItem.orderId],
		references: [sysOrder.id]
	}),
	sysProduct: one(sysProduct, {
		fields: [sysOrderItem.productId],
		references: [sysProduct.id]
	}),
}));

export const sysProductCategoryRelations = relations(sysProductCategory, ({one, many}) => ({
	sysProducts: many(sysProduct),
	sysMerchant: one(sysMerchant, {
		fields: [sysProductCategory.merchantId],
		references: [sysMerchant.id]
	}),
}));

export const sysProductSpecRelations = relations(sysProductSpec, ({one}) => ({
	sysProduct: one(sysProduct, {
		fields: [sysProductSpec.productId],
		references: [sysProduct.id]
	}),
	sysPriceUnit: one(sysPriceUnit, {
		fields: [sysProductSpec.unitId],
		references: [sysPriceUnit.id]
	}),
}));

export const sysPriceUnitRelations = relations(sysPriceUnit, ({many}) => ({
	sysProductSpecs: many(sysProductSpec),
}));

export const sysRatingRelations = relations(sysRating, ({one}) => ({
	sysMerchant: one(sysMerchant, {
		fields: [sysRating.merchantId],
		references: [sysMerchant.id]
	}),
	sysProduct: one(sysProduct, {
		fields: [sysRating.productId],
		references: [sysProduct.id]
	}),
}));

export const sysRolePermissionRelations = relations(sysRolePermission, ({one}) => ({
	sysPermission: one(sysPermission, {
		fields: [sysRolePermission.permissionId],
		references: [sysPermission.id]
	}),
	sysRole: one(sysRole, {
		fields: [sysRolePermission.roleId],
		references: [sysRole.id]
	}),
}));

export const sysPermissionRelations = relations(sysPermission, ({many}) => ({
	sysRolePermissions: many(sysRolePermission),
	sysUserMenus: many(sysUserMenu),
}));

export const sysRoleRelations = relations(sysRole, ({many}) => ({
	sysRolePermissions: many(sysRolePermission),
	sysUserRoles: many(sysUserRole),
}));

export const sysTranslationRelations = relations(sysTranslation, ({one}) => ({
	sysLanguage: one(sysLanguage, {
		fields: [sysTranslation.locale],
		references: [sysLanguage.code]
	}),
}));

export const sysLanguageRelations = relations(sysLanguage, ({many}) => ({
	sysTranslations: many(sysTranslation),
}));

export const sysUserAddressRelations = relations(sysUserAddress, ({one}) => ({
	sysUser: one(sysUser, {
		fields: [sysUserAddress.userId],
		references: [sysUser.id]
	}),
}));

export const sysUserRelations = relations(sysUser, ({many}) => ({
	sysUserAddresses: many(sysUserAddress),
	sysUserMenus: many(sysUserMenu),
	sysUserRoles: many(sysUserRole),
}));

export const sysUserMenuRelations = relations(sysUserMenu, ({one}) => ({
	sysPermission: one(sysPermission, {
		fields: [sysUserMenu.permissionId],
		references: [sysPermission.id]
	}),
	sysUser: one(sysUser, {
		fields: [sysUserMenu.userId],
		references: [sysUser.id]
	}),
}));

export const sysUserRoleRelations = relations(sysUserRole, ({one}) => ({
	sysRole: one(sysRole, {
		fields: [sysUserRole.roleId],
		references: [sysRole.id]
	}),
	sysUser: one(sysUser, {
		fields: [sysUserRole.userId],
		references: [sysUser.id]
	}),
}));