<template>
  <nav
    class="flex justify-between items-center px-10 py-4 bg-white h-16 sticky top-0 z-[100] max-md:px-5 max-md:py-3"
  >
    <div class="flex items-center gap-[15px]">
      <NuxtLink
        to="/portal"
        class="font-black text-xl tracking-tight flex items-center no-underline text-black"
      >
        <svg class="w-5 h-5 mr-[5px]" viewBox="0 0 24 24" fill="black">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
          />
        </svg>
        Vber Eats
      </NuxtLink>
      <slot name="breadcrumb" />
    </div>
    <div class="flex items-center gap-5 text-sm font-semibold">
      <template v-if="!portalAuth.isLoggedIn">
        <NuxtLink to="/portal/login" class="no-underline cursor-pointer">{{
          $t("nav.login")
        }}</NuxtLink>
        <NuxtLink
          to="/portal/register"
          class="bg-black text-white px-4 py-2 rounded-[20px] cursor-pointer no-underline"
          >{{ $t("nav.signup") }}</NuxtLink
        >
      </template>
      <template v-else>
        <div class="relative" ref="dropdownRef">
          <button
            @click="showDropdown = !showDropdown"
            class="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
          >
            <div
              v-if="portalAuth.user?.avatar"
              class="w-8 h-8 rounded-full overflow-hidden"
            >
              <img
                :src="portalAuth.user.avatar"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold"
            >
              {{
                (portalAuth.user?.nickname || portalAuth.user?.username ||
                  "?")[0]
              }}
            </div>
            <span class="max-w-[100px] truncate hidden sm:inline">{{
              portalAuth.user?.nickname || portalAuth.user?.username
            }}</span>
            <svg
              class="w-4 h-4 transition-transform"
              :class="{ 'rotate-180': showDropdown }"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <div
            v-if="showDropdown"
            class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50"
          >
            <NuxtLink
              to="/portal/profile"
              class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
              @click="showDropdown = false"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {{ $t("nav.profile") }}
            </NuxtLink>
            <hr class="my-1 border-gray-100" />
            <button
              @click="handleLogout"
              class="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {{ $t("nav.logout") }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { usePortalAuthStore } from '~/stores/portal-auth'

const portalAuth = usePortalAuthStore()
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function handleLogout() {
  showDropdown.value = false
  portalAuth.logout()
}

onMounted(() => {
  function onClickOutside(e: MouseEvent) {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
      showDropdown.value = false
    }
  }
  document.addEventListener('click', onClickOutside)
  onUnmounted(() => document.removeEventListener('click', onClickOutside))
})
</script>
