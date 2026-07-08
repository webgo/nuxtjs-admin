<template>
  <div class="portal-layout">
    <!-- 顶部导航 -->
    <header class="portal-header">
      <div class="header-inner">
        <div class="header-left">
          <NuxtLink to="/portal" class="logo">
            <span class="logo-icon">🍜</span>
            <span class="logo-text">FoodDelivery</span>
          </NuxtLink>
          <div class="location-picker">
            <el-icon><Location /></el-icon>
            <span class="location-text">配送至：</span>
            <el-input
              v-model="deliveryAddress"
              placeholder="输入配送地址"
              size="small"
              class="address-input"
              clearable
            />
          </div>
        </div>
        <div class="header-right">
          <el-button text class="nav-btn">
            <el-icon><Avatar /></el-icon>
            登录
          </el-button>
          <el-button type="primary" round class="signup-btn">注册</el-button>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="portal-main">
      <slot />
    </main>

    <!-- 底部 -->
    <footer class="portal-footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div class="footer-col">
            <h4>探索</h4>
            <NuxtLink to="/portal">首页</NuxtLink>
            <a href="#">附近餐厅</a>
            <a href="#">美食分类</a>
          </div>
          <div class="footer-col">
            <h4>关于</h4>
            <a href="#">关于我们</a>
            <a href="#">联系方式</a>
            <a href="#">合作商家</a>
          </div>
          <div class="footer-col">
            <h4>法律</h4>
            <a href="#">隐私政策</a>
            <a href="#">服务条款</a>
          </div>
          <div class="footer-col">
            <h4>下载 App</h4>
            <div class="app-badges">
              <a href="#" class="badge">App Store</a>
              <a href="#" class="badge">Google Play</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; 2026 FoodDelivery. All rights reserved.</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Location, Avatar } from '@element-plus/icons-vue'

const deliveryAddress = ref('')
</script>

<style scoped>
.portal-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ===== Header ===== */
.portal-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #eee;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #06C167;
  letter-spacing: -0.5px;
}

.location-picker {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #333;
  font-size: 14px;
}

.location-text {
  white-space: nowrap;
  color: #666;
}

:deep(.address-input) {
  width: 240px;
}

:deep(.address-input .el-input__inner) {
  border-radius: 20px;
  border-color: #ddd;
  height: 36px;
}

:deep(.address-input .el-input__inner:focus) {
  border-color: #06C167;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.signup-btn {
  background: #06C167;
  border-color: #06C167;
  font-weight: 600;
  font-size: 14px;
}

.signup-btn:hover {
  background: #05a558;
  border-color: #05a558;
}

/* ===== Main ===== */
.portal-main {
  flex: 1;
}

/* ===== Footer ===== */
.portal-footer {
  background: #1C1C1C;
  color: #aaa;
  padding: 48px 0 0;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  padding-bottom: 40px;
  border-bottom: 1px solid #333;
}

.footer-col h4 {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
}

.footer-col a {
  display: block;
  color: #aaa;
  text-decoration: none;
  font-size: 14px;
  padding: 4px 0;
  transition: color 0.2s;
}

.footer-col a:hover {
  color: #fff;
}

.app-badges {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.badge {
  background: #333;
  color: #fff !important;
  padding: 8px 16px;
  border-radius: 8px;
  text-align: center;
  font-size: 13px !important;
  font-weight: 500;
}

.footer-bottom {
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  color: #666;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .header-inner {
    padding: 0 16px;
  }

  .location-picker {
    display: none;
  }

  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .logo-text {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
