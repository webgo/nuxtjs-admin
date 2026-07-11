<template>
  <div class="profile-page">
    <!-- 个人资料 -->
    <el-card class="profile-card">
      <template #header><span>个人资料</span></template>
      <div class="profile-content">
        <div class="avatar-section">
          <el-avatar :size="80" :src="authStore.user?.avatar || undefined" icon="UserFilled" />
          <div class="avatar-actions">
            <el-button size="small" @click="triggerAvatarUpload">上传头像</el-button>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              style="display:none"
              @change="handleAvatarChange"
            />
          </div>
        </div>
        <el-form :model="profileForm" label-width="80px" class="profile-form">
          <el-form-item label="用户名">
            <el-input :model-value="authStore.user?.username" disabled />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="profileForm.nickname" placeholder="请输入昵称" maxlength="50" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="profileForm.email" placeholder="请输入邮箱" maxlength="100" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="profileForm.phone" placeholder="请输入手机号" maxlength="20" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="profileLoading" @click="saveProfile">保存修改</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 修改密码 -->
    <el-card class="profile-card">
      <template #header><span>修改密码</span></template>
      <el-form :model="pwdForm" label-width="100px" class="profile-form">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="请输入新密码（至少6位）" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="pwdLoading" @click="changePassword">确认修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { UserFilled } from '@element-plus/icons-vue'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const authStore = useAuthStore()
const { uploadFile: upload } = useFileHelper()
const fileInputRef = ref<HTMLInputElement | null>(null)
const profileLoading = ref(false)
const pwdLoading = ref(false)

const profileForm = reactive({
  nickname: authStore.user?.nickname || '',
  email: authStore.user?.email || '',
  phone: authStore.user?.phone || '',
})

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

function triggerAvatarUpload() {
  fileInputRef.value?.click()
}

async function handleAvatarChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const record = await upload(file, { module: 'avatar' })
    await $fetch('/api/admin/auth/profile', {
      method: 'PUT',
      body: { avatar: record.filePath },
    })
    await authStore.fetchUserInfo()
    ElMessage.success('头像更新成功')
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    ElMessage.error(e.data?.message || '头像上传失败')
  } finally {
    target.value = ''
  }
}

async function saveProfile() {
  profileLoading.value = true
  try {
    const res = await ($fetch('/api/admin/auth/profile', {
      method: 'PUT',
      body: {
        nickname: profileForm.nickname || null,
        email: profileForm.email || null,
        phone: profileForm.phone || null,
      },
    }) as unknown as { code: number; msg?: string })
    if (res.code === 200) {
      await authStore.fetchUserInfo()
      ElMessage.success('保存成功')
    }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    ElMessage.error(e.data?.message || '保存失败')
  } finally {
    profileLoading.value = false
  }
}

async function changePassword() {
  if (!pwdForm.oldPassword || !pwdForm.newPassword) {
    ElMessage.warning('请填写完整')
    return
  }
  if (pwdForm.newPassword.length < 6) {
    ElMessage.warning('新密码至少6位')
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    ElMessage.warning('两次密码输入不一致')
    return
  }
  pwdLoading.value = true
  try {
    const res = await ($fetch('/api/admin/auth/change-password', {
      method: 'PUT',
      body: { oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword },
    }) as unknown as { code: number; msg?: string })
    if (res.code === 200) {
      ElMessage.success('密码修改成功')
      pwdForm.oldPassword = ''
      pwdForm.newPassword = ''
      pwdForm.confirmPassword = ''
    }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    ElMessage.error(e.data?.message || '密码修改失败')
  } finally {
    pwdLoading.value = false
  }
}
</script>

<style scoped>
.profile-page {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}
.profile-card {
  margin-bottom: 16px;
}
.profile-content {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 120px;
  padding-top: 8px;
}
.avatar-actions {
  text-align: center;
}
.profile-form {
  flex: 1;
}
</style>
