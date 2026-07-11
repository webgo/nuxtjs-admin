<template>
  <div class="font-sans bg-white text-black w-full min-h-screen">
    <!-- 导航栏 -->
    <PortalNavbar />

    <!-- 搜索横幅 -->
    <section class="bg-gradient-to-r from-gray-50 to-white px-10 py-8 max-md:px-5 max-md:py-6">
      <div class="max-w-[1200px] mx-auto">
        <h1 class="text-2xl font-bold mb-4 max-md:text-xl">{{ $t("channel.title") }}</h1>
        <div class="flex items-center gap-3 max-md:flex-col max-md:items-stretch">
          <div class="flex-1 h-[48px] max-md:h-[52px] bg-white rounded-lg flex items-center px-4 shadow-sm border border-gray-200">
            <svg class="w-5 h-5 text-gray-400 mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              v-model="keyword"
              type="text"
              :placeholder="$t('channel.searchPlaceholder')"
              class="w-full h-full border-0 text-sm max-md:text-base outline-none bg-transparent h-[48px] max-md:h-[52px]"
              @keyup.enter="handleSearch"
            />
          </div>
          <button
            class="h-[48px] max-md:h-[52px] bg-vbereats-green text-white border-0 rounded-lg px-6 font-semibold text-sm max-md:text-base cursor-pointer shrink-0 transition-colors duration-200 hover:bg-green-600 max-md:w-full"
            @click="handleSearch"
          >
            {{ $t("hero.search") }}
          </button>
        </div>
      </div>
    </section>

    <!-- 分类标签 -->
    <section class="sticky top-16 z-50 bg-white border-b border-gray-100 px-10 py-3 max-md:px-5">
      <div class="max-w-[1200px] mx-auto flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          class="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 shrink-0"
          :class="selectedCategoryId === null ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          @click="selectedCategoryId = null; loadMerchants()"
        >
          {{ $t("channel.allCategories") }}
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 shrink-0"
          :class="selectedCategoryId === cat.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          @click="selectedCategoryId = cat.id; loadMerchants()"
        >
          {{ cat.icon }} {{ cat.name }}
        </button>
      </div>
    </section>

    <!-- 商家列表 -->
    <section class="px-10 py-6 max-md:px-5">
      <div class="max-w-[1200px] mx-auto">
        <div v-if="loading" class="grid grid-cols-4 gap-5 max-md:grid-cols-1 max-lg:grid-cols-2 max-xl:grid-cols-3">
          <div v-for="i in 8" :key="i" class="rounded-lg overflow-hidden">
            <USkeleton class="w-full aspect-[4/3] rounded-none" />
            <div class="p-3 space-y-2">
              <USkeleton class="h-4 w-3/4" />
              <USkeleton class="h-3 w-1/2" />
              <USkeleton class="h-3 w-2/3" />
            </div>
          </div>
        </div>

        <div v-else-if="merchants.length === 0" class="text-center py-20 text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
          </svg>
          <p class="text-base">{{ $t("channel.noMerchants") }}</p>
        </div>

        <div v-else class="grid grid-cols-4 gap-5 max-md:grid-cols-1 max-lg:grid-cols-2 max-xl:grid-cols-3">
          <NuxtLink
            v-for="merchant in merchants"
            :key="merchant.id"
            :to="`/portal/merchant/${merchant.id}`"
            class="group rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200 cursor-pointer no-underline text-black"
          >
            <!-- 封面图 -->
            <div class="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
              <img
                v-if="merchant.coverImage"
                :src="merchant.coverImage"
                :alt="merchant.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🍽️</div>
              <!-- 标签 -->
              <div class="absolute top-2 left-2 flex gap-1">
                <span v-if="merchant.isFeatured" class="bg-vbereats-green text-white text-[11px] font-semibold px-2 py-0.5 rounded-sm">精選</span>
                <span v-if="merchant.isNew" class="bg-orange-400 text-white text-[11px] font-semibold px-2 py-0.5 rounded-sm">NEW</span>
              </div>
              <!-- 配送时间 -->
              <div v-if="merchant.estimatedDeliveryTime" class="absolute bottom-2 left-2 bg-white/90 text-xs font-semibold px-2 py-0.5 rounded">
                {{ merchant.estimatedDeliveryTime }}–{{ merchant.estimatedDeliveryTime + 10 }} {{ $t("channel.minutes") }}
              </div>
            </div>
            <!-- 商家信息 -->
            <div class="p-3">
              <div class="flex items-center justify-between mb-1">
                <h3 class="font-semibold text-base truncate">{{ merchant.name }}</h3>
                <div class="flex items-center gap-1 text-sm shrink-0 ml-2">
                  <span class="text-vbereats-green">★</span>
                  <span class="font-medium">{{ merchant.rating ?? '-' }}</span>
                </div>
              </div>
              <p v-if="merchant.description" class="text-sm text-gray-500 truncate mb-1">{{ merchant.description }}</p>
              <div class="flex items-center gap-3 text-xs text-gray-400">
                <span>{{ $t("channel.deliveryFee") }} {{ merchant.deliveryFee ? `$${merchant.deliveryFee}` : $t("channel.free") }}</span>
                <span>·</span>
                <span>{{ $t("channel.minOrder") }} ${{ merchant.minOrderAmount ?? 0 }}</span>
                <span v-if="merchant.monthlySales">·</span>
                <span v-if="merchant.monthlySales">{{ $t("channel.monthlySales") }} {{ merchant.monthlySales }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore && !loading" class="text-center py-8">
          <button
            class="bg-black text-white px-8 py-2.5 rounded-full text-sm font-semibold cursor-pointer hover:bg-gray-800 transition-colors"
            @click="loadMore"
          >
            {{ $t("hero.search") }}
          </button>
        </div>
      </div>
    </section>

    <!-- 底部（同 index.vue 保持一致） -->
    <footer class="bg-white border-t border-gray-100 pt-10 px-12 pb-5 w-full max-md:px-5 max-md:pb-5 max-md:pt-10">
      <div class="flex justify-between mb-8">
        <div class="text-xl font-black">Vber Eats</div>
        <div class="flex gap-2.5">
          <span class="bg-black text-white px-4 py-2 rounded text-xs flex items-center gap-1.5 cursor-pointer">🛒 {{ $t("footer.appStore") }}</span>
          <span class="bg-black text-white px-4 py-2 rounded text-xs flex items-center gap-1.5 cursor-pointer">▶️ {{ $t("footer.googlePlay") }}</span>
        </div>
      </div>
      <div class="flex justify-between text-[11px] text-gray-500 pt-4 border-t border-gray-100 max-md:flex-col max-md:gap-3">
        <div class="flex gap-3">
          <button
            v-for="lang in availableLocales"
            :key="lang.code"
            class="cursor-pointer hover:underline underline-offset-2"
            :class="locale === lang.code ? 'font-semibold text-black' : ''"
            @click="switchLanguage(lang.code)"
          >
            {{ lang.name }}
          </button>
        </div>
        <div>{{ $t("footer.legal", { year: currentYear }) }}</div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, MerchantCategoryItem, MerchantItem, PaginatedData } from '#shared/types/api'

definePageMeta({
  layout: 'portal',
})

const { t, locale, locales, setLocale } = useI18n()
const route = useRoute()
const router = useRouter()

const currentYear = ref(new Date().getFullYear())
const keyword = ref('')
const deliveryType = ref<'delivery' | 'pickup' | ''>('')
const currentCity = ref('')
const selectedCategoryId = ref<number | null>(null)
const merchants = ref<MerchantItem[]>([])
const categories = ref<MerchantCategoryItem[]>([])
const loading = ref(true)
const page = ref(1)
const pageSize = 12
const total = ref(0)

const hasMore = computed(() => merchants.value.length < total.value)

const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name: string; file: string }>).filter((l) => l.code)
})

type LocaleCode = 'tw' | 'en' | 'jp'
const VALID_LOCALES: LocaleCode[] = ['tw', 'en', 'jp']

// 从 URL 读取 locale 参数和查询参数
onMounted(async () => {
  const localeParam = route.params.locale as string | undefined
  if (localeParam && VALID_LOCALES.includes(localeParam as LocaleCode)) {
    if (localeParam !== locale.value) {
      await setLocale(localeParam as LocaleCode)
    }
  }

  // 从首页搜索/城市点击传入的 query 参数
  if (route.query.address) {
    keyword.value = route.query.address as string
  }
  if (route.query.deliveryType) {
    deliveryType.value = route.query.deliveryType as 'delivery' | 'pickup'
  }
  if (route.query.city) {
    currentCity.value = route.query.city as string
  }

  await loadCategories()
  await loadMerchants()
})

async function loadCategories() {
  try {
    const res = await $fetch<ApiResponse<MerchantCategoryItem[]>>('/api/portal/merchant-category/')
    if (res.code === 200) {
      categories.value = res.data
    }
  } catch {
    // silent
  }
}

async function loadMerchants() {
  loading.value = true
  page.value = 1
  try {
    const params: Record<string, any> = { page: 1, pageSize }
    if (selectedCategoryId.value !== null) {
      params.categoryId = selectedCategoryId.value
    }
    if (keyword.value.trim()) {
      params.keyword = keyword.value.trim()
    }
    if (deliveryType.value) {
      params.deliveryType = deliveryType.value
    }
    if (route.query.lng && route.query.lat) {
      params.longitude = Number(route.query.lng)
      params.latitude = Number(route.query.lat)
    }
    const res = await $fetch<ApiResponse<PaginatedData<MerchantItem>>>('/api/portal/merchant/', { params })
    if (res.code === 200) {
      merchants.value = res.data.list
      total.value = res.data.total
    }
  } catch {
    merchants.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  page.value++
  try {
    const params: Record<string, any> = { page: page.value, pageSize }
    if (selectedCategoryId.value !== null) {
      params.categoryId = selectedCategoryId.value
    }
    if (keyword.value.trim()) {
      params.keyword = keyword.value.trim()
    }
    if (deliveryType.value) {
      params.deliveryType = deliveryType.value
    }
    if (route.query.lng && route.query.lat) {
      params.longitude = Number(route.query.lng)
      params.latitude = Number(route.query.lat)
    }
    const res = await $fetch<ApiResponse<PaginatedData<MerchantItem>>>('/api/portal/merchant/', { params })
    if (res.code === 200) {
      merchants.value.push(...res.data.list)
      total.value = res.data.total
    }
  } catch {
    page.value--
  }
}

function handleSearch() {
  loadMerchants()
}

async function switchLanguage(code: string) {
  await navigateTo(`/portal/${code === 'tw' ? '' : code}/channel`, { replace: true })
  await setLocale(code as LocaleCode)
}
</script>
