<template>
  <div
    class="brand-logo"
    :class="`brand-logo--${size}`"
    aria-hidden="true"
  >
    <img
      class="brand-logo-img"
      src="/assets/images/app-logo.png"
      alt=""
      draggable="false"
    />
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'md'
  },
  /** 保留兼容，统一使用品牌 Logo 图片 */
  variant: {
    type: String,
    default: 'brand'
  }
})
</script>

<style scoped>
.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(40, 180, 70, 0.28);
}

.brand-logo-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.brand-logo--sm {
  width: 40px;
  height: 40px;
  border-radius: 12px;
}

.brand-logo--md {
  width: 48px;
  height: 48px;
  border-radius: 14px;
}

.brand-logo--lg {
  width: 64px;
  height: 64px;
  border-radius: 16px;
}
</style>
