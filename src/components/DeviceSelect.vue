<template>
  <div class="device-select" ref="root">
    <input
      ref="input"
      class="form-control form-control-sm device-select-input"
      :class="{ 'is-invalid': modelValue !== '' && !options.includes(modelValue) }"
      :placeholder="placeholder"
      :value="modelValue"
      autocomplete="off"
      @input="onInput($event.target.value)"
      @focus="onFocus"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="onEnter"
      @keydown.esc="close"
      @keydown.tab="close"
    >
    <button type="button" class="device-select-clear" v-if="modelValue" tabindex="-1" title="清除" @mousedown.prevent="clear">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <i class="fa-solid fa-chevron-down device-select-arrow" :class="{ open: isOpen }" @mousedown.prevent="toggle"></i>

    <ul class="device-select-menu" v-show="isOpen" ref="menu">
      <li
        v-for="(option, index) of filteredOptions"
        :key="option"
        class="device-select-item"
        :class="{ active: index === activeIndex, selected: option === modelValue }"
        @mousedown.prevent="select(option)"
        @mouseenter="activeIndex = index"
      >
        <template v-for="(part, partIndex) of highlight(option)" :key="partIndex">
          <mark v-if="part.match">{{ part.text }}</mark><span v-else>{{ part.text }}</span>
        </template>
        <i class="fa-solid fa-check ms-auto" v-if="option === modelValue"></i>
      </li>
      <li class="device-select-empty" v-if="filteredOptions.length === 0">沒有符合的機台</li>
    </ul>
  </div>
</template>

<script>
/**
 * 可以打字篩選的下拉選單（v-model 綁定選到的字串）。
 * - 打字：不分大小寫、包含即符合，符合的部分會標示出來。
 * - ↑↓ 移動、Enter 選取；清單關著時按 Enter 觸發 enter 事件（例如直接搜尋）；Esc 關閉。
 * - 點欄位時列出全部選項，打字後才開始篩選。
 */
export default {
  name: 'DeviceSelect',
  props: {
    modelValue: { type: String, default: '' },
    options: { type: Array, default: () => [] },
    placeholder: { type: String, default: '輸入或選擇' },
  },
  emits: ['update:modelValue', 'enter'],
  data() {
    return {
      isOpen: false,
      keyword: '',
      activeIndex: -1,
    }
  },
  computed: {
    filteredOptions() {
      const keyword = this.keyword.trim().toLowerCase()
      if (!keyword) return this.options
      return this.options.filter(option => option.toLowerCase().includes(keyword))
    },
  },
  methods: {
    onInput(value) {
      this.$emit('update:modelValue', value.trim())
      this.keyword = value
      this.isOpen = true
      this.activeIndex = this.filteredOptions.length > 0 ? 0 : -1
    },
    onFocus() {
      this.$refs.input.select()
      this.open()
    },
    open() {
      this.keyword = ''
      this.isOpen = true
      this.activeIndex = this.filteredOptions.indexOf(this.modelValue)
      this.$nextTick(this.scrollToActive)
    },
    close() {
      this.isOpen = false
    },
    toggle() {
      if (this.isOpen) {
        this.close()
      } else {
        this.$refs.input.focus()
      }
    },
    move(step) {
      if (!this.isOpen) {
        this.open()
        return
      }
      const count = this.filteredOptions.length
      if (count === 0) return
      this.activeIndex = (this.activeIndex + step + count) % count
      this.$nextTick(this.scrollToActive)
    },
    onEnter() {
      if (this.isOpen && this.activeIndex >= 0 && this.filteredOptions[this.activeIndex]) {
        this.select(this.filteredOptions[this.activeIndex])
        return
      }
      this.close()
      this.$emit('enter')
    },
    select(option) {
      this.$emit('update:modelValue', option)
      this.close()
    },
    clear() {
      this.$emit('update:modelValue', '')
      this.$refs.input.focus()
      this.open()
    },
    scrollToActive() {
      const item = this.$refs.menu?.children[this.activeIndex]
      if (item) item.scrollIntoView({ block: 'nearest' })
    },
    /** 把選項切成一般文字與符合關鍵字的片段 */
    highlight(option) {
      const keyword = this.keyword.trim().toLowerCase()
      const start = keyword ? option.toLowerCase().indexOf(keyword) : -1
      if (start === -1) return [{ text: option, match: false }]
      const end = start + keyword.length
      return [
        { text: option.slice(0, start), match: false },
        { text: option.slice(start, end), match: true },
        { text: option.slice(end), match: false },
      ].filter(part => part.text)
    },
    onClickOutside(event) {
      if (this.isOpen && !this.$refs.root.contains(event.target)) {
        this.close()
      }
    },
  },
  mounted() {
    document.addEventListener('mousedown', this.onClickOutside)
  },
  unmounted() {
    document.removeEventListener('mousedown', this.onClickOutside)
  },
}
</script>

<style>
.device-select {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
}
/* 在 input-group 裡：左邊接標籤，右邊圓角保留 */
.input-group > .device-select:not(:first-child) .device-select-input {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.device-select-input {
  padding-right: 52px;
}
.device-select-input.is-invalid {
  background-image: none;
}
.device-select-clear,
.device-select-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  cursor: pointer;
  z-index: 6;
}
.device-select-clear {
  right: 26px;
  padding: 0 4px;
  border: none;
  background: none;
  font-size: 0.8rem;
}
.device-select-clear:hover {
  color: #212529;
}
.device-select-arrow {
  right: 10px;
  font-size: 0.7rem;
  transition: transform 0.15s;
}
.device-select-arrow.open {
  transform: translateY(-50%) rotate(180deg);
}
.device-select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 260px;
  overflow-y: auto;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  font-size: 0.875rem;
}
.device-select-item {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  cursor: pointer;
}
.device-select-item.active {
  background-color: #e9f2ff;
}
.device-select-item.selected {
  color: #0d6efd;
  font-weight: 600;
}
.device-select-item mark {
  padding: 0;
  background-color: #fff3cd;
  color: inherit;
}
.device-select-empty {
  padding: 6px 12px;
  color: #6c757d;
}
</style>
