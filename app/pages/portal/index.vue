<template>
  <div class="ue-page">
    <!-- ===== Header ===== -->
    <header class="ue-header">
      <div class="ue-header-inner">
        <div class="ue-header-left">
          <button class="ue-hamburger" aria-label="主瀏覽選單">
            <svg viewBox="0 0 20 20" width="20" height="20" fill="#000"><rect y="4" width="20" height="2" rx="1"/><rect y="9" width="20" height="2" rx="1"/><rect y="14" width="20" height="2" rx="1"/></svg>
          </button>
          <NuxtLink to="/portal" class="ue-logo-link" aria-label="Uber Eats 優食 首頁">
            <svg viewBox="0 0 108 20" width="108" height="20"><path d="M8.27 3.77c0 1.99-1.62 3.6-3.61 3.6-2 0-3.62-1.61-3.62-3.6C1.04 1.78 2.66.17 4.66.17c1.99 0 3.61 1.61 3.61 3.6zM4.66 9.7c-3.29 0-5.7-2.66-5.7-5.93C-1.04.5 1.37-2.17 4.66-2.17 7.95-2.17 10.1.5 10.1 3.77c0 3.27-2.15 5.93-5.44 5.93zm16.9-5.77h-7.12v5.36h7.54v1.28h-8.96V.17h8.54v1.28h-7.12v4.01h7.12v1.28h-.01-.01zm10.51 6.64h-1.51l-3.1-5.32v5.32h-1.38V.17h1.25l3.28 5.58V.17h1.46v10.4zm11.24-7.41v7.41h-1.38V6.71h-5.71v3.45h-1.38V.17h1.38v3.94h5.71V.17h1.38v2.99zm3.49 7.41h-1.38V.17h1.38v10.4zm6.57 0h-1.38V2.48l-3.56 8.09h-.76l-3.54-8.09v7.92h-1.38V.17h1.81l3.49 7.95L38.48.17h1.83v10.4h.06-.06zm8.86-7.41v7.41h-1.38V6.71h-5.71v3.45h-1.38V.17h1.38v3.94h5.71V.17h1.38v2.99zm3.48-2.99h4.27l1.53 1.24v1.66l-1.53 1.24h-4.27V1.77zm0 3.91h4l1.83 1.48v1.39l-1.83 1.48h-4V5.68zm-1.38-5.51h6.14l1.94 1.56v.63l-1.94 1.56h-6.14V.17zm0 3.91h5.63l1.94 1.56v.63l-1.94 1.56h-5.63V4.08zm-4.98 7.63h-1.38v-1.13h1.38v1.13zm24.68.52c-4.21 0-7.54-3.23-7.54-7.49 0-4.27 3.33-7.49 7.54-7.49 4.2 0 7.54 3.22 7.54 7.49 0 4.26-3.34 7.49-7.54 7.49zm0-13.56c-3.43 0-6.03 2.73-6.03 6.07 0 3.33 2.6 6.07 6.03 6.07 3.42 0 6.03-2.74 6.03-6.07 0-3.34-2.61-6.07-6.03-6.07z"/></svg>
          </NuxtLink>
        </div>
        <nav class="ue-header-right">
          <a href="https://www.uber.com/tw/ride/" class="ue-ride-link" target="_blank" rel="noopener">
            <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor"><path d="M6 1l5 5-5 5-1.5-1.5L7 7H0V5h7L4.5 2.5 6 1z"/></svg>
            開始搭乘
          </a>
          <NuxtLink to="/admin/login" class="ue-header-login">登入</NuxtLink>
          <NuxtLink to="/admin/login" class="ue-header-signup">註冊</NuxtLink>
        </nav>
      </div>
    </header>

    <!-- ===== Hero ===== -->
    <section class="ue-hero">
      <div class="ue-hero-inner">
        <h1 class="ue-h1">預約附近餐點外送服務</h1>
        <div class="ue-search-row">
          <div class="ue-search-field">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#000"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <input v-model="address" type="text" placeholder="輸入外送地址" class="ue-input" />
          </div>
          <div class="ue-time-picker">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#000"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
            <span>立即外送</span>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#000"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
          </div>
          <button class="ue-find-btn">尋找食物</button>
        </div>
        <p class="ue-hero-login">或 <NuxtLink to="/admin/login" class="ue-hero-login-link">登入</NuxtLink></p>
      </div>
    </section>

    <!-- ===== Promo Cards ===== -->
    <section class="ue-promos">
      <div class="ue-promos-inner">
        <a href="https://www.uber.com/business/eats" class="ue-promo-card" target="_blank" rel="noopener">
          <div class="ue-promo-bg ue-promo-bg--business" />
          <div class="ue-promo-body">
            <p class="ue-promo-desc">以美食慰勞員工辛勞</p>
            <p class="ue-promo-cta">建立企業帳戶</p>
          </div>
        </a>
        <a href="https://merchants.ubereats.com/s/signup/" class="ue-promo-card" target="_blank" rel="noopener">
          <div class="ue-promo-bg ue-promo-bg--restaurant" />
          <div class="ue-promo-body">
            <p class="ue-promo-desc">協助貴餐廳外送美食</p>
            <p class="ue-promo-cta">新增您的餐廳</p>
          </div>
        </a>
        <a href="https://www.uber.com/deliver/" class="ue-promo-card" target="_blank" rel="noopener">
          <div class="ue-promo-bg ue-promo-bg--deliver" />
          <div class="ue-promo-body">
            <p class="ue-promo-desc">透過 Uber Eats 平台上線外送</p>
            <p class="ue-promo-cta">註冊成為合作外送夥伴</p>
          </div>
        </a>
      </div>
    </section>

    <!-- ===== Nearby Cities ===== -->
    <section class="ue-section">
      <div class="ue-section-inner">
        <div class="ue-section-head">
          <h2 class="ue-section-title">附近的城市</h2>
          <a href="#" class="ue-section-link">檢視全部 500 多座城市</a>
        </div>
        <div class="ue-city-list">
          <NuxtLink v-for="c in cities" :key="c" to="#" class="ue-city-link">{{ c }}</NuxtLink>
        </div>
      </div>
    </section>

    <!-- ===== Countries ===== -->
    <section class="ue-section">
      <div class="ue-section-inner">
        <div class="ue-section-head">
          <h2 class="ue-section-title">提供 Uber Eats 優食的國家/地區</h2>
          <a href="#" class="ue-section-link">查看所有國家/地區</a>
        </div>
        <div class="ue-country-grid">
          <NuxtLink v-for="c in countries" :key="c" to="#" class="ue-country-link">{{ c }}</NuxtLink>
        </div>
      </div>
    </section>

    <!-- ===== Footer ===== -->
    <footer class="ue-footer">
      <div class="ue-footer-inner">
        <div class="ue-footer-top">
          <div class="ue-footer-brand">
            <svg viewBox="0 0 108 20" width="134" height="24"><path fill="#000" d="M8.27 3.77c0 1.99-1.62 3.6-3.61 3.6-2 0-3.62-1.61-3.62-3.6C1.04 1.78 2.66.17 4.66.17c1.99 0 3.61 1.61 3.61 3.6zM4.66 9.7c-3.29 0-5.7-2.66-5.7-5.93C-1.04.5 1.37-2.17 4.66-2.17 7.95-2.17 10.1.5 10.1 3.77c0 3.27-2.15 5.93-5.44 5.93zm16.9-5.77h-7.12v5.36h7.54v1.28h-8.96V.17h8.54v1.28h-7.12v4.01h7.12v1.28h-.01-.01zm10.51 6.64h-1.51l-3.1-5.32v5.32h-1.38V.17h1.25l3.28 5.58V.17h1.46v10.4zm11.24-7.41v7.41h-1.38V6.71h-5.71v3.45h-1.38V.17h1.38v3.94h5.71V.17h1.38v2.99zm3.49 7.41h-1.38V.17h1.38v10.4zm6.57 0h-1.38V2.48l-3.56 8.09h-.76l-3.54-8.09v7.92h-1.38V.17h1.81l3.49 7.95L38.48.17h1.83v10.4h.06-.06zm8.86-7.41v7.41h-1.38V6.71h-5.71v3.45h-1.38V.17h1.38v3.94h5.71V.17h1.38v2.99zm3.48-2.99h4.27l1.53 1.24v1.66l-1.53 1.24h-4.27V1.77zm0 3.91h4l1.83 1.48v1.39l-1.83 1.48h-4V5.68zm-1.38-5.51h6.14l1.94 1.56v.63l-1.94 1.56h-6.14V.17zm0 3.91h5.63l1.94 1.56v.63l-1.94 1.56h-5.63V4.08zm-4.98 7.63h-1.38v-1.13h1.38v1.13zm24.68.52c-4.21 0-7.54-3.23-7.54-7.49 0-4.27 3.33-7.49 7.54-7.49 4.2 0 7.54 3.22 7.54 7.49 0 4.26-3.34 7.49-7.54 7.49zm0-13.56c-3.43 0-6.03 2.73-6.03 6.07 0 3.33 2.6 6.07 6.03 6.07 3.42 0 6.03-2.74 6.03-6.07 0-3.34-2.61-6.07-6.03-6.07z"/></svg>
            <div class="ue-footer-downloads">
              <a href="https://apps.apple.com/us/app/uber-eats-food-delivery/id1058959277" class="ue-dl-btn" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#000"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.65-.78 1.19-1.87 1.02-3-.91.04-2.01.6-2.66 1.36-.56.66-1.04 1.73-.84 2.74.98.08 1.98-.51 2.48-1.1z"/></svg>
                iPhone
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.ubercab.eats" class="ue-dl-btn" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#000"><path d="M3 20.5v-17c0-.34.17-.65.44-.82l8.98 9.32-8.98 9.32c-.27-.17-.44-.48-.44-.82M16.19 13.88l-3.89 4.04 5.13 2.66c.56.29 1.23.04 1.5-.51.02-.04.06-.1.07-.14l2-3.94-4.81-2.11m-4.85-.88l-8.44-8.75h0C3.27 2.02 3.63 2 4 2c.29 0 .57.06.84.17l12.45 6.46-4.87 4.37h0m4.68.19l4.82-2.11c.55-.24 1.2.01 1.44.55.03.07.06.14.07.21l.01.02c.12.35.06.74-.2 1.02l-.09.08-2.3 1.21-3.75-1.98z"/></svg>
                Android
              </a>
            </div>
          </div>
          <div class="ue-footer-links">
            <div class="ue-footer-col">
              <a href="https://help.uber.com/ubereats">取得協助</a>
              <a href="https://merchants.ubereats.com/s/signup/">新增您的餐廳</a>
              <a href="https://www.uber.com/deliver/">註冊成為合作外送夥伴</a>
              <a href="https://www.uber.com/business/eats">建立企業帳戶</a>
              <a href="#">優惠</a>
            </div>
            <div class="ue-footer-col">
              <a href="#">我附近的美食外送</a>
              <a href="#">檢視所有城市</a>
              <a href="#">查看所有國家/地區</a>
              <a href="#">我附近的自取選項</a>
              <a href="#">選購生鮮雜貨</a>
              <a href="https://about.ubereats.com">關於 Uber Eats</a>
              <span class="ue-footer-locale">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#000"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM18.92 8h-3.34c-.36-1.42-.91-2.75-1.6-3.92 2.49.68 4.55 2.19 5.94 3.92zM12 4.04c.83 1.2 1.54 2.54 1.99 3.96H9.99C10.46 6.58 11.17 5.24 12 4.04zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h3.34c.36 1.42.91 2.75 1.6 3.92-2.49-.68-4.55-2.19-5.94-3.92zm3.34-8H5.08c1.39-1.73 3.45-3.24 5.94-3.92-.69 1.17-1.24 2.5-1.6 3.92zM12 19.96c-.83-1.2-1.54-2.54-1.99-3.96h3.98c-.45 1.42-1.16 2.76-1.99 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.34.16-2h4.68c.09.66.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.92c.69-1.17 1.24-2.5 1.6-3.92h3.34c-1.39 1.73-3.45 3.24-5.94 3.92z"/></svg>
                中文
              </span>
            </div>
          </div>
        </div>
        <div class="ue-footer-divider" />
        <div class="ue-footer-bottom">
          <div class="ue-footer-social">
            <a href="https://www.facebook.com/ubereats" class="ue-social-link" aria-label="Facebook" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#000"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>
            </a>
            <a href="https://www.twitter.com/ubereats" class="ue-social-link" aria-label="Twitter" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#000"><path d="M22.46 6c-.85.38-1.78.64-2.73.76 1-.6 1.76-1.54 2.12-2.67-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.5-1.53-2.65 0-4.8 2.15-4.8 4.8 0 .38.04.75.12 1.1C7.72 8.78 4.1 6.9 1.62 4.1c-.42.72-.66 1.55-.66 2.44 0 1.68.85 3.15 2.14 4.02-.79-.02-1.53-.24-2.18-.6v.06c0 2.34 1.66 4.3 3.87 4.74-.4.11-.83.17-1.27.17-.31 0-.61-.03-.9-.09.61 1.9 2.38 3.29 4.48 3.33-1.64 1.29-3.7 2.05-5.95 2.05-.39 0-.77-.02-1.15-.07C2.76 21.06 5.82 22 9.1 22c7.38 0 11.42-6.12 11.42-11.42 0-.17-.01-.35-.02-.52.78-.56 1.46-1.27 2-2.06z"/></svg>
            </a>
            <a href="https://www.instagram.com/ubereats" class="ue-social-link" aria-label="Instagram" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#000"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2c-2.2 0-4 1.8-4 4v8c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4V8c0-2.2-1.8-4-4-4h-8m.3 4c0-.6.4-1 1-1h7c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1H9c-.6 0-1-.4-1-1V8m1.5 1.5v5c0 .3.2.5.5.5h5c.3 0 .5-.2.5-.5v-5c0-.3-.2-.5-.5-.5h-5m2.5 1a2 2 0 110 4 2 2 0 010-4m3.5-3.5a1 1 0 100 2 1 1 0 000-2z"/></svg>
            </a>
          </div>
          <div class="ue-footer-legal">
            <a href="https://www.uber.com/legal/privacy/users/">隱私政策</a>
            <a href="https://www.uber.com/terms">條款</a>
            <a href="#">價格</a>
            <a href="https://privacy.uber.com/privacy/california/">請勿銷售或分享我的個人資訊</a>
            <span>營業人名稱 - 優食台灣股份有限公司</span>
            <span>統一編號 - 83076928</span>
            <span>本網站受到 reCAPTCHA 和 Google <a href="https://policies.google.com/privacy">隱私政策</a> 的保護，且適用 <a href="https://policies.google.com/terms">服務條款</a>。</span>
            <span>&copy; 2026 Uber Technologies Inc.</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal' })

const address = ref('')
const cities = ref(['台中', '台北', '台東', '新竹', '桃園', '臺南', '高雄市'])
const countries = ref([
  '丹麥', '厄瓜多', '巴拿馬', '日本', '比利時', '加拿大', '台灣', '瓜地馬拉',
  '多明尼加共和國', '西班牙', '法國', '波蘭', '肯尼亞', '芬蘭', '阿根廷', '南非',
  '美國', '英國', '哥斯達黎加', '挪威', '紐西蘭', '荷蘭', '斯里蘭卡', '智利',
  '愛爾蘭', '瑞士', '瑞典', '義大利', '葡萄牙', '德國', '墨西哥', '澳大利亞',
  '盧森堡', '薩爾瓦多',
])
</script>

<style scoped>
/* ===== Reset ===== */
.ue-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans TC', sans-serif; color: #000; -webkit-font-smoothing: antialiased; }

/* ===== Header ===== */
.ue-header {
  position: sticky; top: 0; z-index: 100;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
}
.ue-header-inner {
  max-width: 1920px; margin: 0 auto; height: 64px;
  padding: 0 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.ue-header-left { display: flex; align-items: center; gap: 16px; }
.ue-hamburger {
  width: 48px; height: 48px; border-radius: 50%; border: none;
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.ue-hamburger:hover { background: #f3f3f3; }
.ue-logo-link { display: flex; align-items: center; text-decoration: none; }
.ue-header-right { display: flex; align-items: center; gap: 8px; }
.ue-ride-link {
  font-size: 14px; font-weight: 500; color: #000; text-decoration: none;
  display: flex; align-items: center; gap: 6px; margin-right: 8px;
}
.ue-header-login {
  font-size: 14px; font-weight: 500; color: #000; text-decoration: none;
  padding: 12px; border-radius: 500px; background: #fff;
  transition: background 0.15s;
}
.ue-header-login:hover { background: #f3f3f3; }
.ue-header-signup {
  font-size: 14px; font-weight: 500; color: #fff; text-decoration: none;
  padding: 12px; border-radius: 500px; background: #000;
  transition: opacity 0.15s;
}
.ue-header-signup:hover { opacity: 0.8; }

/* ===== Hero ===== */
.ue-hero {
  background: #F2CA2F;
  padding: 72px 24px;
  display: flex; align-items: center;
}
.ue-hero-inner {
  max-width: 1920px; margin: 0 auto; width: 100%;
  padding: 0 40px;
}
.ue-h1 {
  font-size: 52px; font-weight: 700; line-height: 64px;
  color: #000; margin: 0 0 40px; max-width: 720px;
}
.ue-search-row {
  display: flex; align-items: stretch; flex-wrap: wrap; gap: 0;
}
.ue-search-field {
  display: flex; align-items: center;
  background: #fff; padding: 4px 16px;
  min-width: 320px;
}
.ue-search-field svg { flex-shrink: 0; margin-right: 10px; }
.ue-input {
  border: none; outline: none;
  font-size: 16px; width: 100%; height: 40px;
  background: transparent; font-family: inherit;
}
.ue-input::placeholder { color: #999; }
.ue-time-picker {
  display: flex; align-items: center; gap: 8px;
  background: #fff; padding: 4px 16px;
  border-left: 1px solid #ddd; cursor: pointer;
  white-space: nowrap; font-size: 16px;
}
.ue-time-picker svg { flex-shrink: 0; }
.ue-find-btn {
  background: #000; color: #fff; border: none;
  font-size: 18px; font-weight: 500;
  padding: 12px 20px; border-radius: 8px;
  cursor: pointer; font-family: inherit; margin-left: 8px;
  white-space: nowrap; transition: opacity 0.15s;
}
.ue-find-btn:hover { opacity: 0.8; }
.ue-hero-login { margin-top: 24px; font-size: 16px; color: #000; }
.ue-hero-login-link { color: #000; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
.ue-hero-login-link:hover { text-decoration: none; }

/* ===== Promo Cards ===== */
.ue-promos { padding: 24px 24px 48px; }
.ue-promos-inner {
  max-width: 1920px; margin: 0 auto; padding: 0 40px;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
}
.ue-promo-card {
  position: relative; display: flex; align-items: flex-end;
  height: 500px; text-decoration: none; overflow: hidden;
}
.ue-promo-bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
}
.ue-promo-bg--business { background: linear-gradient(rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect fill="%23222" width="800" height="600"/><text x="400" y="320" text-anchor="middle" fill="%23555" font-size="140">🏢</text></svg>'); }
.ue-promo-bg--restaurant { background: linear-gradient(rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect fill="%23333" width="800" height="600"/><text x="400" y="320" text-anchor="middle" fill="%23555" font-size="140">🍳</text></svg>'); }
.ue-promo-bg--deliver { background: linear-gradient(rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect fill="%23444" width="800" height="600"/><text x="400" y="320" text-anchor="middle" fill="%23555" font-size="140">🛵</text></svg>'); }
.ue-promo-body { position: relative; padding: 40px; width: 100%; }
.ue-promo-desc { font-size: 16px; color: #fff; margin: 0 0 8px; opacity: 0.9; font-weight: 400; }
.ue-promo-cta { font-size: 18px; font-weight: 600; color: #fff; margin: 0; text-decoration: underline; text-underline-offset: 3px; }

/* ===== Sections (Cities, Countries) ===== */
.ue-section { padding: 48px 24px; border-bottom: 1px solid #e5e5e5; }
.ue-section-inner { max-width: 1920px; margin: 0 auto; padding: 0 40px; }
.ue-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.ue-section-title { font-size: 24px; font-weight: 700; color: #000; margin: 0; }
.ue-section-link { font-size: 14px; color: #000; text-decoration: underline; font-weight: 500; text-underline-offset: 2px; }
.ue-section-link:hover { text-decoration: none; }

.ue-city-list { display: flex; flex-wrap: wrap; }
.ue-city-link { font-size: 14px; color: #000; text-decoration: underline; padding: 6px 0; margin-right: 24px; text-underline-offset: 2px; }
.ue-city-link:hover { text-decoration: none; }

.ue-country-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
.ue-country-link { font-size: 14px; color: #000; text-decoration: underline; padding: 6px 0; text-underline-offset: 2px; }
.ue-country-link:hover { text-decoration: none; }

/* ===== Footer ===== */
.ue-footer { background: #fff; padding: 72px 24px 88px; margin-top: 64px; }
.ue-footer-inner { max-width: 1920px; margin: 0 auto; padding: 0 40px; }
.ue-footer-top { display: grid; grid-template-columns: 1fr 2fr; gap: 48px; }
.ue-footer-logo { display: block; margin-bottom: 24px; }
.ue-footer-downloads { display: flex; gap: 12px; }
.ue-dl-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: #f3f3f3; color: #000;
  font-size: 14px; font-weight: 500;
  padding: 12px; border-radius: 500px;
  text-decoration: none; transition: background 0.15s;
}
.ue-dl-btn:hover { background: #e0e0e0; }
.ue-footer-links { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.ue-footer-col { display: flex; flex-direction: column; gap: 0; }
.ue-footer-col a {
  font-size: 16px; font-weight: 400; color: #000;
  text-decoration: none; padding: 8px 0;
  transition: opacity 0.15s;
}
.ue-footer-col a:hover { opacity: 0.6; }
.ue-footer-locale {
  display: flex; align-items: center; gap: 6px;
  font-size: 16px; margin-top: 8px; cursor: pointer;
}
.ue-footer-divider { border-top: 1px solid #e5e5e5; margin: 32px 0; }
.ue-footer-bottom { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
.ue-footer-social { display: flex; gap: 12px; }
.ue-social-link { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; transition: background 0.15s; }
.ue-social-link:hover { background: #f3f3f3; }
.ue-footer-legal { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: #999; }
.ue-footer-legal a { color: #999; text-decoration: underline; font-size: 12px; text-underline-offset: 2px; }
.ue-footer-legal a:hover { color: #000; }

/* ===== Responsive ===== */
@media (max-width: 1024px) {
  .ue-h1 { font-size: 42px; }
  .ue-promos-inner { grid-template-columns: repeat(2, 1fr); }
  .ue-promos-inner .ue-promo-card:last-child { grid-column: 1 / -1; }
  .ue-country-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .ue-header-inner { padding: 0 16px; }
  .ue-hamburger { width: 40px; height: 40px; }
  .ue-ride-link { display: none; }
  .ue-hero { padding: 48px 16px; }
  .ue-hero-inner { padding: 0 16px; }
  .ue-h1 { font-size: 32px; line-height: 40px; max-width: 100%; margin-bottom: 28px; }
  .ue-search-row { flex-direction: column; gap: 8px; }
  .ue-time-picker { border-left: none; }
  .ue-find-btn { margin-left: 0; width: 100%; text-align: center; }
  .ue-promos { padding: 16px 16px 32px; }
  .ue-promos-inner { padding: 0 16px; grid-template-columns: 1fr; }
  .ue-promos-inner .ue-promo-card:last-child { grid-column: auto; }
  .ue-promo-card { height: 280px; }
  .ue-section { padding: 32px 16px; }
  .ue-section-inner { padding: 0 16px; }
  .ue-section-title { font-size: 20px; }
  .ue-country-grid { grid-template-columns: repeat(2, 1fr); }
  .ue-footer { padding: 48px 16px 64px; }
  .ue-footer-inner { padding: 0 16px; }
  .ue-footer-top { grid-template-columns: 1fr; gap: 32px; }
  .ue-footer-links { grid-template-columns: 1fr 1fr; }
  .ue-footer-bottom { flex-direction: column; }
}
@media (max-width: 480px) {
  .ue-h1 { font-size: 26px; }
  .ue-country-grid { grid-template-columns: 1fr 1fr; }
  .ue-footer-links { grid-template-columns: 1fr; }
}
</style>
