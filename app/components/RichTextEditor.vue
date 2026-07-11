<template>
  <div class="quill-editor-wrapper">
    <ClientOnly>
      <QuillEditor
        ref="editorRef"
        v-model:content="innerValue"
        content-type="html"
        :options="editorOptions"
        @ready="onEditorReady"
        @update:content="$emit('update:modelValue', $event)"
      />
      <template #fallback>
        <div class="editor-loading">
          <el-skeleton :rows="6" animated />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const innerValue = ref(props.modelValue)
const editorRef = ref<InstanceType<typeof QuillEditor>>()
const uploadLoading = ref(false)

watch(() => props.modelValue, (v) => {
  innerValue.value = v
})

const editorOptions = {
  modules: {
    toolbar: {
      container: [
        [{ header: [false, 1, 2, 3, 4, 5] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        [{ color: [] }, { background: [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  },
  placeholder: '请输入内容详情...',
}

let quillInstance: any = null

function onEditorReady(quill: any) {
  quillInstance = quill
}

function imageHandler() {
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', 'image/*')
  input.click()

  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return

    const range = quillInstance?.getSelection(true)
    if (!range) return

    // 在光标处插入加载占位
    const index = range.index
    quillInstance.insertText(index, '正在上传图片…', { color: '#999' })
    quillInstance.disable()

    try {
      const formData = new FormData()
      formData.append('files', file)
      const res: any = await $fetch('/api/admin/file/upload', {
        method: 'POST',
        body: formData,
      })

      // 删除占位文本
      quillInstance.deleteText(index, 7)
      // 插入图片
      const url = res.data.filePath || res.data[0]?.filePath
      if (url) {
        quillInstance.insertEmbed(index, 'image', url)
        quillInstance.setSelection(index + 1)
      }
    } catch {
      quillInstance.deleteText(index, 7)
      ElMessage.error('图片上传失败')
    } finally {
      quillInstance.enable()
    }
  }
}
</script>

<style scoped>
.quill-editor-wrapper {
  width: 100%;
}
.editor-loading {
  padding: 20px 0;
}
:deep(.ql-editor) {
  min-height: 280px;
  max-height: 500px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.7;
}
:deep(.ql-toolbar) {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
:deep(.ql-container) {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}
</style>
