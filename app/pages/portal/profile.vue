<template>
  <div class="font-sans bg-white text-black w-full min-h-screen">
    <PortalNavbar />

    <div class="max-w-[800px] mx-auto px-10 py-8 max-md:px-5">
      <h1 class="text-2xl font-bold mb-6">{{ $t("profile.title") }}</h1>

      <!-- Tabs -->
      <div class="flex gap-6 border-b border-gray-200 mb-8">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="pb-3 text-sm font-semibold border-b-2 transition-colors bg-transparent border-x-transparent border-t-transparent cursor-pointer"
          :class="
            activeTab === tab.key
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          "
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Personal Info Tab -->
      <div v-if="activeTab === 'info'">
        <div class="space-y-5 max-w-[500px]">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("profile.username") }}</label>
            <input
              :value="portalAuth.user?.username"
              disabled
              class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("profile.nickname") }}</label>
            <input
              v-model="profileForm.nickname"
              :placeholder="$t('profile.nicknamePlaceholder')"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("profile.email") }}</label>
            <input
              v-model="profileForm.email"
              :placeholder="$t('profile.emailPlaceholder')"
              type="email"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("profile.phone") }}</label>
            <input
              v-model="profileForm.phone"
              :placeholder="$t('profile.phonePlaceholder')"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button
            @click="saveProfile"
            :disabled="profileLoading"
            class="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {{ profileLoading ? $t("profile.saving") : $t("profile.save") }}
          </button>
        </div>
      </div>

      <!-- Address Tab -->
      <div v-if="activeTab === 'address'">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-semibold">{{ $t("address.title") }}</h2>
          <button
            @click="openAddressForm()"
            class="bg-black text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {{ $t("address.add") }}
          </button>
        </div>

        <div v-if="addresses.length === 0" class="text-gray-400 text-center py-12">
          {{ $t("address.noAddresses") }}
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="addr in addresses"
            :key="addr.id"
            class="border border-gray-200 rounded-lg p-4 flex justify-between items-start"
          >
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span v-if="addr.label" class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{{ addr.label }}</span>
                <span class="font-semibold">{{ addr.name }}</span>
                <span class="text-gray-400">{{ addr.phone }}</span>
                <span v-if="addr.isDefault" class="text-xs bg-black text-white px-2 py-0.5 rounded">Default</span>
              </div>
              <p class="text-sm text-gray-500">
                {{ [addr.province, addr.city, addr.district, addr.detail].filter(Boolean).join(' ') }}
              </p>
            </div>
            <div class="flex gap-2 shrink-0">
              <button
                @click="openAddressForm(addr)"
                class="text-sm text-gray-500 hover:text-black cursor-pointer bg-transparent border-none"
              >
                {{ $t("address.edit") }}
              </button>
              <button
                @click="deleteAddress(addr.id)"
                class="text-sm text-red-500 hover:text-red-700 cursor-pointer bg-transparent border-none"
              >
                {{ $t("address.delete") }}
              </button>
            </div>
          </div>
        </div>

        <!-- Address Form Modal -->
        <div
          v-if="showAddressModal"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
          @click.self="showAddressModal = false"
        >
          <div class="bg-white rounded-xl p-6 w-full max-w-[500px] max-h-[85vh] overflow-y-auto">
            <h3 class="text-lg font-semibold mb-4">
              {{ editingAddress ? $t("address.edit") : $t("address.add") }}
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("address.label") }}</label>
                <input
                  v-model="addressForm.label"
                  :placeholder="$t('address.labelPlaceholder')"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("address.recipientName") }} *</label>
                <input
                  v-model="addressForm.name"
                  :placeholder="$t('address.recipientNamePlaceholder')"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("address.phone") }} *</label>
                <input
                  v-model="addressForm.phone"
                  :placeholder="$t('address.phonePlaceholder')"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("address.province") }}</label>
                  <input
                    v-model="addressForm.province"
                    :placeholder="$t('address.provincePlaceholder')"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("address.city") }}</label>
                  <input
                    v-model="addressForm.city"
                    :placeholder="$t('address.cityPlaceholder')"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("address.district") }}</label>
                  <input
                    v-model="addressForm.district"
                    :placeholder="$t('address.districtPlaceholder')"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("address.detail") }} *</label>
                <input
                  v-model="addressForm.detail"
                  :placeholder="$t('address.detailPlaceholder')"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="addressForm.isDefault" type="checkbox" class="w-4 h-4 accent-black" />
                <span class="text-sm text-gray-700">{{ $t("address.isDefault") }}</span>
              </label>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button
                @click="showAddressModal = false"
                class="px-4 py-2 text-sm text-gray-600 hover:text-black cursor-pointer bg-transparent border-none"
              >
                {{ $t("merchant.cancel") }}
              </button>
              <button
                @click="saveAddress"
                :disabled="addressSaving"
                class="bg-black text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {{ addressSaving ? $t("profile.saving") : $t("profile.save") }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Tab -->
      <div v-if="activeTab === 'security'">
        <div class="space-y-5 max-w-[500px]">
          <h2 class="text-lg font-semibold">{{ $t("auth.changePassword") }}</h2>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("auth.oldPassword") }}</label>
            <input
              v-model="pwdForm.oldPassword"
              type="password"
              :placeholder="$t('auth.oldPasswordPlaceholder')"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("auth.newPassword") }}</label>
            <input
              v-model="pwdForm.newPassword"
              type="password"
              :placeholder="$t('auth.newPasswordPlaceholder')"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("auth.confirmNewPassword") }}</label>
            <input
              v-model="pwdForm.confirmPassword"
              type="password"
              :placeholder="$t('auth.confirmNewPasswordPlaceholder')"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button
            @click="changePassword"
            :disabled="pwdLoading"
            class="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {{ pwdLoading ? $t("profile.saving") : $t("auth.changePassword") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserAddressItem, UserAddressCreateBody } from '#shared/types/api'
import { usePortalAuthStore } from '~/stores/portal-auth'

definePageMeta({ layout: 'portal' })

const { t } = useI18n()
const portalAuth = usePortalAuthStore()
const router = useRouter()
const toast = useToast()

if (!portalAuth.isLoggedIn) {
  navigateTo('/portal/login')
}

const tabs = computed(() => [
  { key: 'info', label: t('profile.personalInfo') },
  { key: 'address', label: t('profile.addresses') },
  { key: 'security', label: t('profile.security') },
])

const activeTab = ref('info')

// Profile
const profileLoading = ref(false)
const profileForm = reactive({
  nickname: portalAuth.user?.nickname || '',
  email: portalAuth.user?.email || '',
  phone: portalAuth.user?.phone || '',
})

watch(() => portalAuth.user, (u) => {
  if (u) {
    profileForm.nickname = u.nickname || ''
    profileForm.email = u.email || ''
    profileForm.phone = u.phone || ''
  }
})

async function saveProfile() {
  profileLoading.value = true
  try {
    await $fetch('/api/portal/auth/profile', {
      method: 'PUT',
      body: {
        nickname: profileForm.nickname || null,
        email: profileForm.email || null,
        phone: profileForm.phone || null,
      },
    })
    await portalAuth.fetchUserInfo()
    toast.add({ title: t('auth.updateSuccess'), color: 'success' })
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ title: e.data?.message || t('auth.updateFailed'), color: 'error' })
  } finally {
    profileLoading.value = false
  }
}

// Addresses
const addresses = ref<UserAddressItem[]>([])
const showAddressModal = ref(false)
const editingAddress = ref<UserAddressItem | null>(null)
const addressSaving = ref(false)
const addressForm = reactive({
  label: '',
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false,
})

async function loadAddresses() {
  try {
    const res = await $fetch<{ code: number; data: UserAddressItem[] }>('/api/portal/address')
    addresses.value = res.data
  } catch {
    addresses.value = []
  }
}

watch(activeTab, (v) => {
  if (v === 'address') loadAddresses()
})

function openAddressForm(addr?: UserAddressItem) {
  editingAddress.value = addr || null
  if (addr) {
    addressForm.label = addr.label || ''
    addressForm.name = addr.name
    addressForm.phone = addr.phone
    addressForm.province = addr.province || ''
    addressForm.city = addr.city || ''
    addressForm.district = addr.district || ''
    addressForm.detail = addr.detail
    addressForm.isDefault = addr.isDefault === 1
  } else {
    addressForm.label = ''
    addressForm.name = ''
    addressForm.phone = ''
    addressForm.province = ''
    addressForm.city = ''
    addressForm.district = ''
    addressForm.detail = ''
    addressForm.isDefault = false
  }
  showAddressModal.value = true
}

async function saveAddress() {
  if (!addressForm.name) { toast.add({ title: t('address.nameRequired'), color: 'warning' }); return }
  if (!addressForm.phone) { toast.add({ title: t('address.phoneRequired'), color: 'warning' }); return }
  if (!addressForm.detail) { toast.add({ title: t('address.detailRequired'), color: 'warning' }); return }

  addressSaving.value = true
  try {
    const body: UserAddressCreateBody = {
      name: addressForm.name,
      phone: addressForm.phone,
      detail: addressForm.detail,
      label: addressForm.label || undefined,
      province: addressForm.province || undefined,
      city: addressForm.city || undefined,
      district: addressForm.district || undefined,
      isDefault: addressForm.isDefault ? 1 : 0,
    }

    if (editingAddress.value) {
      await $fetch(`/api/portal/address/${editingAddress.value.id}`, { method: 'PUT', body })
      toast.add({ title: t('address.updateSuccess'), color: 'success' })
    } else {
      await $fetch('/api/portal/address', { method: 'POST', body })
      toast.add({ title: t('address.addSuccess'), color: 'success' })
    }
    showAddressModal.value = false
    await loadAddresses()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ title: e.data?.message || 'Error', color: 'error' })
  } finally {
    addressSaving.value = false
  }
}

async function deleteAddress(id: number) {
  try {
    await $fetch(`/api/portal/address/${id}`, { method: 'DELETE' })
    toast.add({ title: t('address.deleteSuccess'), color: 'success' })
    await loadAddresses()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ title: e.data?.message || 'Error', color: 'error' })
  }
}

// Password
const pwdLoading = ref(false)
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

async function changePassword() {
  if (!pwdForm.oldPassword || !pwdForm.newPassword) {
    toast.add({ title: t('auth.changePassword'), color: 'warning' })
    return
  }
  if (pwdForm.newPassword.length < 6) {
    toast.add({ title: t('auth.passwordMinLength'), color: 'warning' })
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    toast.add({ title: t('auth.passwordMismatch'), color: 'warning' })
    return
  }
  pwdLoading.value = true
  try {
    await $fetch('/api/portal/auth/change-password', {
      method: 'PUT',
      body: { oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword },
    })
    toast.add({ title: t('auth.passwordChanged'), color: 'success' })
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ title: e.data?.message || t('auth.passwordChangeFailed'), color: 'error' })
  } finally {
    pwdLoading.value = false
  }
}

onMounted(() => {
  portalAuth.fetchUserInfo()
})
</script>
