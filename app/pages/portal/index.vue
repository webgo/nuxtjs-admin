<template>
  <div class="font-sans bg-white text-black w-full">
    <!-- 导航栏 -->
    <nav
      class="flex justify-between items-center px-10 py-4 bg-white h-16 sticky top-0 z-[100] max-md:px-5 max-md:py-3"
    >
      <div class="flex items-center gap-[15px]">
        <div class="font-black text-xl tracking-tight flex items-center">
          <svg class="w-5 h-5 mr-[5px]" viewBox="0 0 24 24" fill="black">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            />
          </svg>
          Uber Eats
        </div>
      </div>
      <div class="flex items-center gap-5 text-sm font-semibold">
        <NuxtLink to="/admin/login" class="no-underline cursor-pointer">{{
          $t("nav.login")
        }}</NuxtLink>
        <NuxtLink
          to="/admin/login"
          class="bg-black text-white px-4 py-2 rounded-[20px] cursor-pointer no-underline"
          >{{ $t("nav.signup") }}</NuxtLink
        >
        <div
          class="bg-black text-white size-[30px] rounded-full flex items-center justify-center text-sm cursor-pointer"
        >
          0
        </div>
      </div>
    </nav>

    <!-- 英雄横幅 -->
    <section
      class="relative min-h-[calc(100vh-64px)] flex items-center bg-cover bg-center bg-no-repeat max-md:min-h-screen max-md:px-5"
      style="
        background-image: url(&quot;https://www.ubereats.com/_static/c413f20400e04805.webp&quot;);
      "
    >
      <div
        class="bg-transparent py-8 max-w-[900px] w-full ml-[10%] box-border max-md:max-w-full max-md:ml-0"
      >
        <h1 class="text-[32px] font-bold mb-6 tracking-wide text-black">
          {{ $t("hero.title") }}
        </h1>

        <div
          class="flex items-center gap-2.5 flex-wrap max-md:flex-col max-md:items-stretch"
        >
          <div
            class="w-[500px] max-w-[calc(100vw-40px)] h-[55px] bg-white rounded-lg flex items-center px-4 shadow-md shrink-0 max-md:w-full"
          >
            <input
              v-model="address"
              type="text"
              :placeholder="$t('hero.addressPlaceholder')"
              class="w-full h-full border-0 text-base outline-none bg-transparent"
            />
          </div>

          <div class="relative shrink-0 max-md:w-full order-type-dropdown">
            <div
              class="h-[55px] bg-white border border-gray-200 rounded-lg px-5 text-[15px] font-medium text-gray-700 flex items-center gap-2 cursor-pointer shadow-md select-none max-md:w-full max-md:justify-center"
              @click="showOrderTypeDropdown = !showOrderTypeDropdown"
            >
              <span>{{ orderType === 'delivery' ? '🚚' : '📦' }} {{ orderType === 'delivery' ? $t('hero.delivery') : $t('hero.pickup') }}</span>
              <svg
                class="w-3.5 h-3.5 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': showOrderTypeDropdown }"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            <div
              v-if="showOrderTypeDropdown"
              class="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-md:w-full"
            >
              <div
                class="px-5 py-3 text-[15px] font-medium text-gray-700 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                :class="{ 'bg-gray-50': orderType === 'delivery' }"
                @click="selectOrderType('delivery')"
              >
                <span>🚚 {{ $t('hero.delivery') }}</span>
              </div>
              <div
                class="px-5 py-3 text-[15px] font-medium text-gray-700 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                :class="{ 'bg-gray-50': orderType === 'pickup' }"
                @click="selectOrderType('pickup')"
              >
                <span>📦 {{ $t('hero.pickup') }}</span>
              </div>
            </div>
          </div>

          <button
            class="h-[55px] bg-black text-white border-0 rounded-lg px-8 font-semibold text-base cursor-pointer shrink-0 transition-colors duration-200 hover:bg-gray-800 max-md:w-full max-md:justify-center"
            @click="handleSearch"
          >
            {{ $t("hero.search") }}
          </button>
        </div>

        <div
          class="mt-4 text-sm text-black underline cursor-pointer"
          @click="handleLogin"
        >
          {{ $t("hero.loginHint") }}
        </div>
      </div>
    </section>

    <!-- 内容主体 -->
    <div class="w-full px-12 box-border max-md:px-5">
      <!-- 三栏卡片 -->
      <section class="py-[60px] grid grid-cols-3 gap-5 max-md:grid-cols-1">
        <article
          v-for="(card, idx) in featureCards"
          :key="idx"
          class="bg-white rounded-lg overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
        >
          <div
            class="w-full aspect-[5/3] bg-cover bg-center"
            :style="{ backgroundImage: `url(${card.img})` }"
          />
          <div class="p-5">
            <h3 class="text-3xl font-bold mb-2">{{ card.title }}</h3>
            <p class="text-base text-gray-500">{{ card.subtitle }}</p>
          </div>
        </article>
      </section>

      <!-- 附近城市 -->
      <section class="py-10">
        <div class="flex justify-between items-end mb-8">
          <h2 class="text-3xl font-bold">{{ $t("cities.title") }}</h2>
          <a href="#" class="text-base text-black underline"
            >{{ $t("cities.viewAll") }} &gt;</a
          >
        </div>

        <div
          ref="mapContainer"
          class="w-full h-[400px] rounded-lg mb-8 relative bg-gray-100"
        >
          <div
            v-if="!mapReady"
            class="absolute inset-0 flex items-center justify-center text-base text-gray-500"
          >
            <span>📍 {{ $t("cities.mapLabel") }}</span>
          </div>
        </div>

        <div class="grid grid-cols-5 gap-5 max-md:grid-cols-2">
          <div v-for="city in cities" :key="city.name" class="flex flex-col">
            <span class="font-semibold text-base mb-0.5">{{ city.name }}</span>
            <span class="text-sm text-gray-500">{{ city.country }}</span>
          </div>
        </div>
      </section>

      <!-- 国家/地区 -->
      <section class="py-10 border-t border-gray-100">
        <div class="flex justify-between items-end mb-8">
          <h2 class="text-3xl font-bold">{{ $t("countries.title") }}</h2>
          <a href="#" class="text-base text-black underline"
            >{{ $t("countries.viewAll") }} &gt;</a
          >
        </div>
        <div class="grid grid-cols-5 gap-5 mt-8 max-md:grid-cols-2">
          <div
            v-for="country in countries"
            :key="country"
            class="text-base mb-2 cursor-pointer hover:underline"
          >
            {{ country }}
          </div>
        </div>
      </section>
    </div>

    <!-- 底部 -->
    <footer
      class="bg-white border-t border-gray-100 pt-10 px-12 pb-5 w-full max-md:px-5 max-md:pb-5 max-md:pt-10"
    >
      <div class="flex justify-between mb-8">
        <div class="text-xl font-black">Uber Eats</div>
        <div class="flex gap-2.5">
          <span
            class="bg-black text-white px-4 py-2 rounded text-xs flex items-center gap-1.5 cursor-pointer"
            >🛒 {{ $t("footer.appStore") }}</span
          >
          <span
            class="bg-black text-white px-4 py-2 rounded text-xs flex items-center gap-1.5 cursor-pointer"
            >▶️ {{ $t("footer.googlePlay") }}</span
          >
        </div>
      </div>

      <div
        class="grid grid-cols-4 gap-5 py-8 border-t border-gray-100 max-md:grid-cols-2"
      >
        <div v-for="col in footerColumns" :key="col.title">
          <h4 class="text-base font-semibold mb-4">{{ col.title }}</h4>
          <ul>
            <li
              v-for="link in col.links"
              :key="link"
              class="mb-2.5 text-base text-gray-700 cursor-pointer hover:underline"
            >
              {{ link }}
            </li>
          </ul>
        </div>
      </div>

      <div
        class="flex justify-between text-[11px] text-gray-500 pt-4 border-t border-gray-100 max-md:flex-col max-md:gap-3"
      >
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
        <div>
          {{ $t("footer.legal", { year: currentYear }) }}
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "portal",
  path: "/portal/:locale?",
});

const { t, locale, locales, setLocale } = useI18n();
const route = useRoute();

const address = ref("");
const currentYear = ref(new Date().getFullYear());
const orderType = ref<"delivery" | "pickup">("delivery");
const showOrderTypeDropdown = ref(false);

function selectOrderType(type: "delivery" | "pickup") {
  orderType.value = type;
  showOrderTypeDropdown.value = false;
}

// 高德地图
const mapContainer = ref<HTMLDivElement>();
const mapReady = ref(false);
let mapInstance: any = null;

interface CityMarker {
  name: string;
  lng: number;
  lat: number;
}

const cityMarkers: CityMarker[] = [
  { name: "台北市", lng: 121.5654, lat: 25.033 },
  { name: "台中市", lng: 120.6736, lat: 24.1477 },
  { name: "台南市", lng: 120.1888, lat: 22.9984 },
  { name: "高雄市", lng: 120.2942, lat: 22.6168 },
  { name: "新竹市", lng: 120.9675, lat: 24.8067 },
];

type LocaleCode = "tw" | "en" | "jp";
const VALID_LOCALES: LocaleCode[] = ["tw", "en", "jp"];

// 从 URL 路径读取语言并设置（首次加载 / 刷新时）
onMounted(async () => {
  const localeParam = route.params.locale;
  if (
    localeParam &&
    typeof localeParam === "string" &&
    VALID_LOCALES.includes(localeParam as LocaleCode)
  ) {
    if (localeParam !== locale.value) {
      setLocale(localeParam as LocaleCode);
    }
  }

  // 等待 DOM 就绪后初始化高德地图
  await nextTick();
  await initMap();

  // 点击下拉框外部时关闭
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (showOrderTypeDropdown.value && !target.closest(".order-type-dropdown")) {
      showOrderTypeDropdown.value = false;
    }
  });
});

const availableLocales = computed(() => {
  return (
    locales.value as Array<{ code: string; name: string; file: string }>
  ).filter((l) => l.code);
});

// 功能卡片（显式依赖 locale 确保切换时重新计算）
const featureCards = computed(() => {
  void locale.value;
  return [
    {
      img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600",
      title: t("features.card1.title"),
      subtitle: t("features.card1.subtitle"),
    },
    {
      img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600",
      title: t("features.card2.title"),
      subtitle: t("features.card2.subtitle"),
    },
    {
      img: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600",
      title: t("features.card3.title"),
      subtitle: t("features.card3.subtitle"),
    },
  ];
});

// 城市列表
const cityKeys = [
  "taichung",
  "tainan",
  "taipei",
  "kaohsiung",
  "hsinchu",
] as const;

const cities = computed(() => {
  void locale.value;
  return cityKeys.map((key) => ({
    name: t(`cities.${key}`),
    country: t("cities.country"),
  }));
});

// 国家/地区列表
const countryKeys = [
  "us",
  "ca",
  "uk",
  "fr",
  "de",
  "jp",
  "kr",
  "au",
  "nz",
  "sg",
  "my",
  "th",
  "mx",
  "br",
  "ar",
] as const;

const countries = computed(() => {
  void locale.value;
  return countryKeys.map((key) => t(`countries.${key}`));
});

// 底部栏目
const footerColumns = computed(() => {
  void locale.value;
  return [
    {
      title: t("footer.col1.title"),
      links: [
        t("footer.col1.link1"),
        t("footer.col1.link2"),
        t("footer.col1.link3"),
      ],
    },
    {
      title: t("footer.col2.title"),
      links: [
        t("footer.col2.link1"),
        t("footer.col2.link2"),
        t("footer.col2.link3"),
      ],
    },
    {
      title: t("footer.col3.title"),
      links: [
        t("footer.col3.link1"),
        t("footer.col3.link2"),
        t("footer.col3.link3"),
      ],
    },
    {
      title: t("footer.col4.title"),
      links: [
        t("footer.col4.link1"),
        t("footer.col4.link2"),
        t("footer.col4.link3"),
      ],
    },
  ];
});

async function initMap() {
  if (!mapContainer.value) return;

  const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;
  const AMap = await AMapLoader.load({
    key: "2800db7c8be2584b74a978c6297c2e2c",
    version: "1.4.15",
  });

  mapInstance = new AMap.Map(mapContainer.value, {
    features: ["bg", "building", "point"],
    center: [120.7, 23.7],
    zoom: 7,
    zoomEnable: false,
    dragEnable: false,
    scrollWheel: false,
    doubleClickZoom: false,
    touchZoom: false,
    keyboardEnable: false,
    pitchEnable: false,
    showIndoorMap: false,
    showLabel: false,
  });

  const markers: any[] = [];

  cityMarkers.forEach((city) => {
    const marker = new AMap.Marker({
      position: [city.lng, city.lat],
      content: `<div style="width:10px;height:10px;background:#000;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
      offset: new AMap.Pixel(-5, -5),
      label: {
        content: `<div class="amap-marker-my">${city.name}</div>`,
        direction: "top",
        offset: new AMap.Pixel(0, -6),
      },
    });
    mapInstance!.add(marker);
    markers.push(marker);
  });

  mapReady.value = true;
}

async function switchLanguage(code: string) {
  await navigateTo(`/portal/${code === "tw" ? "" : code}`, { replace: true });
  await setLocale(code as LocaleCode);
}

function handleSearch() {
  if (address.value.trim()) {
    console.log("Searching:", address.value);
  }
}

function handleLogin() {
  navigateTo("/admin/login");
}
</script>

<style>
/* 设置地图标记点上的文本样式 */
.amap-marker-label{
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  font-size: 12px !important;
  color: #000 !important;
  font-weight: bold !important;
}
</style>
