<template>
  <div class="font-sans bg-white text-black w-full min-h-screen">
    <!-- 导航栏 -->
    <nav class="flex justify-between items-center px-10 py-4 bg-white h-16 sticky top-0 z-[100] max-md:px-5 max-md:py-3">
      <div class="flex items-center gap-[15px]">
        <NuxtLink to="/portal" class="font-black text-xl tracking-tight flex items-center no-underline text-black">
          <svg class="w-5 h-5 mr-[5px]" viewBox="0 0 24 24" fill="black">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
          Vber Eats
        </NuxtLink>
        <span class="text-gray-300 mx-1">/</span>
        <span class="text-sm text-gray-500 truncate max-w-[200px]">{{ merchant?.name }}</span>
      </div>
      <div class="flex items-center gap-5 text-sm font-semibold">
        <NuxtLink to="/admin/login" class="no-underline cursor-pointer">{{ $t("nav.login") }}</NuxtLink>
        <NuxtLink to="/admin/login" class="bg-black text-white px-4 py-2 rounded-[20px] cursor-pointer no-underline">{{ $t("nav.signup") }}</NuxtLink>
      </div>
    </nav>

    <!-- 加载状态 -->
    <template v-if="loading">
      <div class="max-w-[1200px] mx-auto px-10 py-6 max-md:px-5">
        <USkeleton class="w-full h-[240px] rounded-lg mb-6" />
        <div class="flex items-center gap-4 mb-6">
          <USkeleton class="w-16 h-16 rounded-full shrink-0" />
          <div class="space-y-2 flex-1">
            <USkeleton class="h-6 w-48" />
            <USkeleton class="h-4 w-32" />
          </div>
        </div>
        <div class="flex gap-2 mb-6">
          <USkeleton v-for="i in 4" :key="i" class="h-8 w-20 rounded-full" />
        </div>
        <div class="grid grid-cols-3 gap-4 max-md:grid-cols-1 max-lg:grid-cols-2">
          <div v-for="i in 6" :key="i" class="rounded-lg overflow-hidden border border-gray-100">
            <USkeleton class="w-full aspect-[4/3] rounded-none" />
            <div class="p-3 space-y-2">
              <USkeleton class="h-4 w-3/4" />
              <USkeleton class="h-3 w-full" />
              <USkeleton class="h-3 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 商家不存在 -->
    <template v-else-if="!merchant">
      <div class="text-center py-32 text-gray-400">
        <svg class="w-20 h-20 mx-auto mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
        </svg>
        <p class="text-lg">商家不存在或已關閉</p>
        <NuxtLink to="/portal" class="text-vbereats-green underline mt-4 inline-block text-sm">返回首頁</NuxtLink>
      </div>
    </template>

    <!-- 正常内容 -->
    <template v-else>
      <!-- 商家封面图 -->
      <div class="relative w-full h-[240px] bg-gray-100 max-md:h-[160px]">
        <img
          v-if="merchant.coverImage"
          :src="merchant.coverImage"
          :alt="merchant.name"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-6xl">🍽️</div>
      </div>

      <!-- 商家信息 -->
      <div class="max-w-[1200px] mx-auto px-10 max-md:px-5">
        <div class="flex items-start gap-5 -mt-10 relative z-10 mb-6 max-md:flex-col max-md:items-stretch max-md:-mt-0 max-md:gap-3 max-md:pt-4">
          <div class="w-20 h-20 rounded-xl bg-white shadow-md shrink-0 flex items-center justify-center text-3xl overflow-hidden border border-gray-100 max-md:w-16 max-md:h-16">
            <img v-if="merchant.logo" :src="merchant.logo" :alt="merchant.name" class="w-full h-full object-cover" />
            <span v-else>🏪</span>
          </div>
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold mb-1">{{ merchant.name }}</h1>
            <p v-if="merchant.description" class="text-sm text-gray-500 mb-2">{{ merchant.description }}</p>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span class="flex items-center gap-1">
                <span class="text-vbereats-green">★</span>
                <span class="font-semibold text-black">{{ merchant.rating ?? '-' }}</span>
                <span>({{ merchant.ratingCount ?? 0 }})</span>
              </span>
              <span>{{ merchant.monthlySales ?? 0 }}{{ $t("merchant.monthlySales") }}</span>
              <span>{{ $t("merchant.deliveryFee") }} {{ merchant.deliveryFee ? `$${merchant.deliveryFee}` : $t("merchant.free") }}</span>
              <span>{{ $t("merchant.minOrder") }} ${{ merchant.minOrderAmount ?? 0 }}</span>
              <span v-if="merchant.estimatedDeliveryTime">{{ merchant.estimatedDeliveryTime }}–{{ merchant.estimatedDeliveryTime + 10 }} {{ $t("merchant.minutes") }}</span>
            </div>
            <!-- 标签 -->
            <div v-if="merchant.tags" class="flex gap-1.5 mt-2">
              <UBadge
                v-for="tag in tagList"
                :key="tag"
                color="neutral"
                variant="soft"
                size="sm"
              >
                {{ tag }}
              </UBadge>
            </div>
          </div>
        </div>

        <!-- 分类导航（水平滚动标签） -->
        <div class="sticky top-16 z-40 bg-white -mx-10 px-10 py-2 border-b border-gray-100 max-md:-mx-5 max-md:px-5">
          <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              v-for="cat in merchant.categories"
              :key="cat.id"
              class="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 shrink-0"
              :class="activeCategoryId === cat.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              @click="scrollToCategory(cat.id)"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>

        <!-- 商品列表（按分类分组） -->
        <div class="py-6">
          <div v-for="cat in merchant.categories" :key="cat.id" :ref="(el) => setCategoryRef(cat.id, el as HTMLElement)" class="mb-8">
            <h2 class="text-lg font-bold mb-4">{{ cat.name }}</h2>
            <div class="space-y-3">
              <div
                v-for="product in productsByCategory(cat.id)"
                :key="product.id"
                class="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <!-- 商品图片 -->
                <div class="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                  <img
                    v-if="product.image"
                    :src="product.image"
                    :alt="product.name"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🍜</div>
                </div>
                <!-- 商品信息 -->
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-base">{{ product.name }}</h3>
                  <p v-if="product.description" class="text-sm text-gray-500 mt-0.5 line-clamp-2">{{ product.description }}</p>
                  <div class="flex items-center justify-between mt-2">
                    <span class="font-bold text-base">{{ product.priceRange || specPriceLabel(product.specs[0]) }}</span>
                    <button
                      class="bg-vbereats-green text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-green-600 transition-colors shrink-0"
                      @click="handleAddProduct(product)"
                    >
                      {{ $t("merchant.addToCart") }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 浮动的购物车按钮 -->
      <button
        class="fixed bottom-6 right-6 z-30 bg-black text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
        @click="showCart = true"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span v-if="cartItemCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{{ cartItemCount }}</span>
      </button>
    </template>

    <!-- 规格选择弹窗 -->
    <UModal v-model:open="showSpecModal">
      <template #content>
        <div class="p-6">
          <h3 v-if="selectedProduct" class="text-lg font-bold mb-4">{{ selectedProduct.name }}</h3>
          <p v-if="selectedProduct" class="text-sm text-gray-500 mb-4">{{ $t("merchant.selectSpec") }}</p>
          <div class="space-y-3 mb-6">
            <button
              v-for="spec in selectedProduct?.specs ?? []"
              :key="spec.id"
              class="w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors"
              :class="selectedSpecId === spec.id ? 'border-vbereats-green bg-green-50' : 'border-gray-200 hover:border-gray-300'"
              @click="selectedSpecId = spec.id"
            >
              <span class="font-medium">{{ spec.name }}</span>
              <span class="font-bold">{{ unitSymbol(spec.unitSymbol) }}{{ spec.price }}</span>
            </button>
          </div>
          <button
            class="w-full bg-vbereats-green text-white font-semibold py-3 rounded-lg text-center cursor-pointer hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="selectedSpecId === null"
            @click="confirmAddToCart"
          >
            {{ $t("merchant.confirm") }}
          </button>
        </div>
      </template>
    </UModal>

    <!-- 购物车侧栏 -->
    <USlideover v-model:open="showCart">
      <template #title>
        <span class="font-bold text-lg">{{ $t("merchant.cart") }}</span>
      </template>
      <template #body>
        <div v-if="cartItems.length === 0" class="text-center py-20 text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <p>{{ $t("merchant.cartEmpty") }}</p>
        </div>
        <div v-else class="space-y-4">
          <div v-for="item in cartItems" :key="item.id" class="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div class="w-12 h-12 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
              <img v-if="item.productImage" :src="item.productImage" :alt="item.productName" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300">🍜</div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ item.productName }}</p>
              <p v-if="item.specName" class="text-xs text-gray-400">{{ item.specName }}</p>
              <p class="text-sm font-bold mt-0.5">{{ item.unitSymbol }}{{ (item.price ?? 0) * item.quantity }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                class="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                @click="updateCartQuantity(item, item.quantity - 1)"
              >−</button>
              <span class="w-5 text-center text-sm font-medium">{{ item.quantity }}</span>
              <button
                class="w-7 h-7 rounded-full bg-vbereats-green text-white flex items-center justify-center text-sm cursor-pointer hover:bg-green-600 transition-colors"
                @click="updateCartQuantity(item, item.quantity + 1)"
              >+</button>
            </div>
          </div>
        </div>
      </template>
      <template #footer v-if="cartItems.length > 0">
        <div class="space-y-3">
          <div class="flex items-center justify-between font-bold text-base">
            <span>{{ $t("merchant.total") }}</span>
            <span>{{ cartItems[0]?.unitSymbol }}{{ cartTotal }}</span>
          </div>
          <button class="w-full bg-vbereats-green text-white font-semibold py-3 rounded-lg text-center cursor-pointer hover:bg-green-600 transition-colors">
            {{ $t("merchant.checkout") }}
          </button>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, CartItem, MerchantDetail, ProductItem, ProductSpecItem } from '#shared/types/api'

definePageMeta({
  layout: 'portal',
})

const { t, locale, locales, setLocale } = useI18n()
const route = useRoute()
const router = useRouter()

const currentYear = ref(new Date().getFullYear())
const merchant = ref<MerchantDetail | null>(null)
const loading = ref(true)
const activeCategoryId = ref<number | null>(null)
const categoryRefs = new Map<number, HTMLElement>()

// 规格弹窗
const showSpecModal = ref(false)
const selectedProduct = ref<ProductItem | null>(null)
const selectedSpecId = ref<number | null>(null)

// 购物车
const showCart = ref(false)
const cartItems = ref<CartItem[]>([])
const isLoggedIn = ref(false)

type LocaleCode = 'tw' | 'en' | 'jp'
const VALID_LOCALES: LocaleCode[] = ['tw', 'en', 'jp']

const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name: string; file: string }>).filter((l) => l.code)
})

const tagList = computed(() => {
  if (!merchant.value?.tags) return []
  return merchant.value.tags.split(',').map((t) => t.trim()).filter(Boolean)
})

const cartItemCount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

const cartTotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)
})

function unitSymbol(sym: string | undefined): string {
  return sym || ''
}

function specPriceLabel(spec: ProductSpecItem | undefined): string {
  if (!spec) return '$0'
  return `${unitSymbol(spec.unitSymbol)}${spec.price}`
}

function productsByCategory(categoryId: number): ProductItem[] {
  if (!merchant.value) return []
  return merchant.value.products.filter((p) => p.categoryId === categoryId && p.status === 1)
}

function setCategoryRef(id: number, el: HTMLElement | null) {
  if (el) {
    categoryRefs.set(id, el)
  } else {
    categoryRefs.delete(id)
  }
}

function scrollToCategory(categoryId: number) {
  activeCategoryId.value = categoryId
  const el = categoryRefs.get(categoryId)
  if (el) {
    const offset = 180
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

// 检查登录状态
function checkAuth() {
  const token = useCookie('token')
  isLoggedIn.value = !!token.value
}

const toast = useToast()

// 加入购物车处理
function handleAddProduct(product: ProductItem) {
  if (!isLoggedIn.value) {
    toast.add({ title: t('merchant.loginRequired'), color: 'warning' })
    router.push('/admin/login')
    return
  }

  if (product.specs.length > 1) {
    // 多规格 → 弹出规格选择
    selectedProduct.value = product
    selectedSpecId.value = null
    showSpecModal.value = true
  } else if (product.specs.length === 1) {
    // 单一规格 → 直接加入
    addToCart(product, product.specs[0]!)
  }
}

async function confirmAddToCart() {
  if (!selectedProduct.value || selectedSpecId.value === null) return
  const spec = selectedProduct.value.specs.find((s) => s.id === selectedSpecId.value)
  if (spec) {
    await addToCart(selectedProduct.value, spec)
  }
  showSpecModal.value = false
  selectedProduct.value = null
  selectedSpecId.value = null
}

async function addToCart(product: ProductItem, spec: ProductSpecItem) {
  try {
    const res = await $fetch<ApiResponse<unknown>>('/api/eats/cart', {
      method: 'POST',
      body: {
        merchantId: product.merchantId,
        productId: product.id,
        specName: spec.name,
        quantity: 1,
      },
    })
    if (res.code === 200) {
      await loadCart()
      toast.add({ title: t('merchant.itemAdded'), color: 'success' })
    }
  } catch {
    // silent
  }
}

async function updateCartQuantity(item: CartItem, newQty: number) {
  if (newQty <= 0) {
    // 数量为0 → 删除
    try {
      const res = await $fetch<ApiResponse<unknown>>(`/api/eats/cart/${item.id}`, { method: 'DELETE' })
      if (res.code === 200) {
        await loadCart()
      }
    } catch {
      // silent
    }
  } else {
    try {
      const res = await $fetch<ApiResponse<unknown>>(`/api/eats/cart/${item.id}`, {
        method: 'PUT',
        body: { quantity: newQty },
      })
      if (res.code === 200) {
        await loadCart()
      }
    } catch {
      // silent
    }
  }
}

async function loadCart() {
  if (!isLoggedIn.value) return
  try {
    const res = await $fetch<ApiResponse<Array<{ merchantId: number; merchantName: string; items: CartItem[] }>>>('/api/eats/cart')
    if (res.code === 200 && Array.isArray(res.data)) {
      cartItems.value = res.data.flatMap(g => g.items ?? [])
    } else {
      cartItems.value = []
    }
  } catch {
    cartItems.value = []
  }
}

onMounted(async () => {
  // 从 URL 读取 locale
  const localeParam = route.params.locale as string | undefined
  if (localeParam && VALID_LOCALES.includes(localeParam as LocaleCode)) {
    if (localeParam !== locale.value) {
      await setLocale(localeParam as LocaleCode)
    }
  }

  checkAuth()

  const id = route.params.id as string
  if (!id) {
    loading.value = false
    return
  }

  try {
    const res = await $fetch<ApiResponse<MerchantDetail>>(`/api/eats/merchant/${id}`)
    if (res.code === 200) {
      merchant.value = res.data
      if (res.data.categories.length > 0) {
        activeCategoryId.value = res.data.categories[0]!.id
      }
    }
  } catch {
    merchant.value = null
  } finally {
    loading.value = false
  }

  await loadCart()
})

async function switchLanguage(code: string) {
  await navigateTo(`/portal/${code === 'tw' ? '' : code}/merchant/${route.params.id}`, { replace: true })
  await setLocale(code as LocaleCode)
}
</script>
