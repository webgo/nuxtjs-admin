<template>
  <div class="ue-page">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-left">
        <div class="nav-logo">
          <svg viewBox="0 0 24 24" fill="black"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
          Uber Eats
        </div>
      </div>
      <div class="nav-right">
        <NuxtLink to="/admin/login" class="btn-login">登入</NuxtLink>
        <NuxtLink to="/admin/login" class="btn-signup">註冊</NuxtLink>
        <div class="nav-cart">0</div>
      </div>
    </nav>

    <!-- 英雄横幅 -->
    <section class="hero">
      <div class="hero-overlay">
        <h1>預約附近餐點外送服務</h1>

        <div class="search-row">
          <div class="search-input-wrapper">
            <input v-model="address" type="text" placeholder="輸入地址" />
          </div>

          <div class="dropdown-btn">
            <span>🚚 外送</span>
          </div>

          <button class="search-btn" @click="handleSearch">開始搜尋</button>
        </div>

        <div class="hero-sub" @click="handleLogin">登入以查看最近地址</div>
      </div>
    </section>

    <!-- 内容主体 -->
    <div class="full-width-content">

      <!-- 三栏卡片 -->
      <section class="features">
        <article v-for="(card, idx) in featureCards" :key="idx" class="feature-card">
          <div class="feature-img" :style="{ backgroundImage: `url(${card.img})` }" />
          <div class="feature-content">
            <h3>{{ card.title }}</h3>
            <p>{{ card.subtitle }}</p>
          </div>
        </article>
      </section>

      <!-- 附近城市 -->
      <section class="cities-section">
        <div class="section-header">
          <h2>附近的城市</h2>
          <a href="#">查看超過 500 座城市 &gt;</a>
        </div>

        <div class="map-placeholder">
          <span>📍 地圖區域</span>
        </div>

        <div class="city-grid">
          <div v-for="city in cities" :key="city.name" class="city-item">
            <span>{{ city.name }}</span>
            <span>{{ city.country }}</span>
          </div>
        </div>
      </section>

      <!-- 国家/地区 -->
      <section class="countries-section">
        <div class="section-header">
          <h2>提供 Uber Eats 優食的國家/地區</h2>
          <a href="#">查看所有地區 &gt;</a>
        </div>
        <div class="country-grid">
          <div v-for="country in countries" :key="country" class="country-item">{{ country }}</div>
        </div>
      </section>
    </div>

    <!-- 底部 -->
    <footer class="footer">
      <div class="footer-top">
        <div class="footer-logo">Uber Eats</div>
        <div class="footer-apps">
          <span class="app-btn">🛒 App Store</span>
          <span class="app-btn">▶️ Google Play</span>
        </div>
      </div>

      <div class="footer-grid">
        <div v-for="col in footerColumns" :key="col.title" class="footer-col">
          <h4>{{ col.title }}</h4>
          <ul>
            <li v-for="link in col.links" :key="link">{{ link }}</li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-bottom-social">
          <span v-for="s in socialItems" :key="s">{{ s }}</span>
        </div>
        <div>
          隱私權 · 使用條款 · 網站使用規範 · 關於此頁面的資訊 · © {{ currentYear }} Uber Technologies Inc.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal' })

const address = ref('')
const currentYear = ref(new Date().getFullYear())

const featureCards = [
  { img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600', title: '以美食獎勵員工辛勞', subtitle: '建立企業帳戶' },
  { img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600', title: '協助餐廳夥伴外送美食', subtitle: '與我們合作' },
  { img: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600', title: '透過 Uber Eats 平台接外送', subtitle: '以合作外送夥伴身分加入' },
]

const cities = [
  { name: '台中', country: '台灣' },
  { name: '台南', country: '台灣' },
  { name: '台北', country: '台灣' },
  { name: '高雄', country: '台灣' },
  { name: '新竹', country: '台灣' },
]

const countries = [
  '美國', '加拿大', '英國', '法國', '德國',
  '日本', '韓國', '澳洲', '紐西蘭', '新加坡',
  '馬來西亞', '泰國', '墨西哥', '巴西', '阿根廷',
]

const footerColumns = [
  {
    title: '關於我們',
    links: ['新聞稿', '我們的部落格', '以合作外送夥伴身分加入'],
  },
  {
    title: '探索',
    links: ['查看所有城市', '查看所有國家/地區', '查看所有餐廳'],
  },
  {
    title: '隱私權與條款',
    links: ['隱私權政策', '使用條款', 'Cookie 政策'],
  },
  {
    title: '協助與支援',
    links: ['常見問題', '聯絡我們', '中文'],
  },
]

const socialItems = ['FB', 'IG', 'TW', 'YT']

function handleSearch() {
  if (address.value.trim()) {
    console.log('Searching:', address.value)
  }
}

function handleLogin() {
  navigateTo('/admin/login')
}
</script>

<style>
/* 全局重置 — 非 scoped */
html, body {
  margin: 0;
  padding: 0;
}
*, *::before, *::after {
  box-sizing: border-box;
}
</style>

<style scoped>
/* 页面基础 */
.ue-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #fff;
  color: #000;
  width: 100%;
}
.ue-page a {
  text-decoration: none;
  color: inherit;
}
.ue-page ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 全屏宽度 + 左右间距 */
.full-width-content {
  width: 100%;
  padding: 0 50px;
  box-sizing: border-box;
}

/* ===== 顶部导航 ===== */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 40px;
  background: #fff;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 15px;
}
.nav-logo {
  font-weight: 900;
  font-size: 20px;
  letter-spacing: -1px;
  display: flex;
  align-items: center;
}
.nav-logo svg {
  width: 20px;
  height: 20px;
  margin-right: 5px;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
  font-weight: 600;
}
.btn-login {
  cursor: pointer;
}
.nav-right .btn-signup {
  background: #000;
  color: #fff !important;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  text-decoration: none;
}
.nav-cart {
  background: #000;
  color: #fff;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
}

/* ===== Hero ===== */
.hero {
  position: relative;
  height: calc(100vh - 64px);
  background: url('https://www.ubereats.com/_static/c413f20400e04805.webp') center / cover no-repeat;
  display: flex;
  align-items: center;
}
.hero-overlay {
  background: transparent;
  padding: 30px 0;
  max-width: 900px;
  width: 100%;
  margin-left: 10%;
  border-radius: 0;
  box-sizing: border-box;
}
.hero h1 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 25px;
  letter-spacing: 1px;
  color: #000;
}

/* 搜索栏 */
.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.search-input-wrapper {
  width: 500px;
  max-width: calc(100vw - 40px);
  height: 55px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}
.search-input-wrapper input {
  width: 100%;
  height: 100%;
  border: none;
  font-size: 16px;
  outline: none;
  background: transparent;
  font-family: inherit;
}
.dropdown-btn {
  height: 55px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0 20px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  font-family: inherit;
}
.search-btn {
  height: 55px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0 32px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
  font-family: inherit;
}
.search-btn:hover {
  background: #333;
}
.hero-sub {
  margin-top: 15px;
  font-size: 14px;
  color: #000;
  text-decoration: underline;
  cursor: pointer;
}

/* ===== 三栏卡片 ===== */
.features {
  padding: 60px 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.feature-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}
.feature-card:hover {
  transform: scale(1.02);
}
.feature-img {
  width: 100%;
  aspect-ratio: 5 / 3;
  background-size: cover;
  background-position: center;
}
.feature-content {
  padding: 20px;
}
.feature-content h3 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}
.feature-content p {
  font-size: 16px;
  color: #666;
}

/* ===== 城市列表 & 国家列表 ===== */
.cities-section {
  padding: 40px 0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
}
.section-header h2 {
  font-size: 28px;
  font-weight: 700;
}
.section-header a {
  font-size: 16px;
  color: #000;
  text-decoration: underline;
}

/* 地图区域 */
.map-placeholder {
  width: 100%;
  height: 360px;
  background-color: #f2f2f2;
  border-radius: 8px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
  background-image: url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
}

.city-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}
.city-item {
  display: flex;
  flex-direction: column;
}
.city-item span:first-child {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 2px;
}
.city-item span:last-child {
  font-size: 14px;
  color: #666;
}

.countries-section {
  padding: 40px 0;
  border-top: 1px solid #eee;
}
.country-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-top: 30px;
}
.country-item {
  font-size: 16px;
  margin-bottom: 8px;
  cursor: pointer;
}
.country-item:hover {
  text-decoration: underline;
}

/* ===== 底部 ===== */
.footer {
  background: #fff;
  border-top: 1px solid #eee;
  padding: 40px 50px 20px;
  width: 100%;
}
.footer-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}
.footer-logo {
  font-size: 20px;
  font-weight: 900;
}
.footer-apps {
  display: flex;
  gap: 10px;
}
.app-btn {
  background: #000;
  color: #fff;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 30px 0;
  border-top: 1px solid #eee;
}
.footer-col h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
}
.footer-col ul li {
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
}
.footer-col ul li:hover {
  text-decoration: underline;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #666;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
.footer-bottom-social {
  display: flex;
  gap: 15px;
}
.footer-bottom-social span {
  cursor: pointer;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .full-width-content {
    padding: 0 20px;
  }
  .footer {
    padding: 40px 20px 20px;
  }
  .navbar {
    padding: 12px 20px;
  }
  .hero {
    height: 100vh;
    padding: 40px 20px;
  }
  .hero-overlay {
    max-width: 100%;
    margin-left: 0;
  }
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }
  .search-input-wrapper {
    width: 100%;
  }
  .dropdown-btn,
  .search-btn {
    width: 100%;
    justify-content: center;
  }
  .features {
    grid-template-columns: 1fr;
  }
  .city-grid,
  .country-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
