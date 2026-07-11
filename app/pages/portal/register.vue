<template>
  <div class="font-sans bg-white text-black w-full min-h-screen">
    <nav class="flex justify-between items-center px-10 py-4 bg-white h-16 sticky top-0 z-[100] max-md:px-5 max-md:py-3">
      <NuxtLink to="/portal" class="font-black text-xl tracking-tight flex items-center no-underline text-black">
        <svg class="w-5 h-5 mr-[5px]" viewBox="0 0 24 24" fill="black">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
        Vber Eats
      </NuxtLink>
    </nav>

    <div class="flex items-center justify-center py-16 px-5">
      <div class="w-full max-w-[420px]">
        <h1 class="text-[28px] font-bold mb-2">{{ $t('auth.registerTitle') }}</h1>
        <p class="text-gray-500 text-sm mb-8">{{ $t('auth.registerSubtitle') }}</p>

        <div v-if="successMsg" class="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-lg mb-6">
          {{ successMsg }}
        </div>

        <div v-if="errorMsg" class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleRegister">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1.5">{{ $t('auth.username') }}</label>
            <input
              v-model="form.username"
              type="text"
              :placeholder="$t('auth.usernamePlaceholder')"
              class="w-full h-[48px] border border-gray-300 rounded-lg px-4 text-sm outline-none focus:border-black transition-colors"
              :class="{ 'border-red-500': errors.username }"
              @blur="validateUsername"
            />
            <p v-if="errors.username" class="text-red-500 text-xs mt-1">{{ errors.username }}</p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-1.5">{{ $t('auth.email') }}</label>
            <input
              v-model="form.email"
              type="email"
              :placeholder="$t('auth.emailPlaceholder')"
              class="w-full h-[48px] border border-gray-300 rounded-lg px-4 text-sm outline-none focus:border-black transition-colors"
              :class="{ 'border-red-500': errors.email }"
              @blur="validateEmail"
            />
            <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-1.5">{{ $t('auth.nickname') }}</label>
            <input
              v-model="form.nickname"
              type="text"
              :placeholder="$t('auth.nicknamePlaceholder')"
              class="w-full h-[48px] border border-gray-300 rounded-lg px-4 text-sm outline-none focus:border-black transition-colors"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-1.5">{{ $t('auth.phone') }}</label>
            <input
              v-model="form.phone"
              type="tel"
              :placeholder="$t('auth.phonePlaceholder')"
              class="w-full h-[48px] border border-gray-300 rounded-lg px-4 text-sm outline-none focus:border-black transition-colors"
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium mb-1.5">{{ $t('auth.password') }}</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="$t('auth.passwordPlaceholder')"
                class="w-full h-[48px] border border-gray-300 rounded-lg px-4 pr-12 text-sm outline-none focus:border-black transition-colors"
                :class="{ 'border-red-500': errors.password }"
                @blur="validatePassword"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</p>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium mb-1.5">{{ $t('auth.confirmPassword') }}</label>
            <input
              v-model="form.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="$t('auth.confirmPasswordPlaceholder')"
              class="w-full h-[48px] border border-gray-300 rounded-lg px-4 text-sm outline-none focus:border-black transition-colors"
              :class="{ 'border-red-500': errors.confirmPassword }"
              @blur="validateConfirmPassword"
            />
            <p v-if="errors.confirmPassword" class="text-red-500 text-xs mt-1">{{ errors.confirmPassword }}</p>
          </div>

          <button
            type="submit"
            class="w-full h-[48px] bg-black text-white rounded-lg font-semibold text-sm cursor-pointer transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            <span v-if="loading" class="inline-flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ $t('auth.registering') }}
            </span>
            <span v-else>{{ $t('auth.register') }}</span>
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          {{ $t('auth.hasAccount') }}
          <NuxtLink to="/portal/login" class="text-black font-semibold underline ml-1">
            {{ $t('auth.goLogin') }}
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'portal',
  middleware: 'portal-auth',
})

const { t } = useI18n()
const portalAuth = usePortalAuthStore()

const form = reactive({
  username: '',
  email: '',
  nickname: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

function validateUsername() {
  if (!form.username) {
    errors.username = t('auth.usernameRequired')
  } else if (form.username.length < 2 || form.username.length > 20) {
    errors.username = t('auth.usernameLength')
  } else {
    errors.username = ''
  }
}

function validateEmail() {
  if (!form.email) {
    errors.email = t('auth.emailRequired')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = t('auth.emailInvalid')
  } else {
    errors.email = ''
  }
}

function validatePassword() {
  if (!form.password) {
    errors.password = t('auth.passwordRequired')
  } else if (form.password.length < 6) {
    errors.password = t('auth.passwordMinLength')
  } else {
    errors.password = ''
  }
}

function validateConfirmPassword() {
  if (!form.confirmPassword) {
    errors.confirmPassword = t('auth.confirmPasswordRequired')
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = t('auth.passwordMismatch')
  } else {
    errors.confirmPassword = ''
  }
}

function validateAll() {
  validateUsername()
  validateEmail()
  validatePassword()
  validateConfirmPassword()
  return !errors.username && !errors.email && !errors.password && !errors.confirmPassword
}

async function handleRegister() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!validateAll()) return

  loading.value = true
  try {
    await portalAuth.register({
      username: form.username,
      email: form.email,
      password: form.password,
      nickname: form.nickname || undefined,
      phone: form.phone || undefined,
    })
    successMsg.value = t('auth.registerSuccess')
    setTimeout(() => {
      navigateTo('/portal/login')
    }, 3000)
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }; message?: string }
    errorMsg.value = error.data?.message || error.message || t('auth.registerFailed')
  } finally {
    loading.value = false
  }
}
</script>
