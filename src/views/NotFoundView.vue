<template>
  <div class="container not-found">
    <p class="not-found__code mono">404</p>
    <h1 class="not-found__title">페이지를 찾을 수 없습니다</h1>
    <p class="not-found__text">주소가 바뀌었거나 없는 페이지입니다.</p>
    <RouterLink to="/" class="btn btn--primary">홈으로 돌아가기</RouterLink>
  </div>
</template>

<style scoped>
.not-found {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding-block: var(--space-16);
  text-align: center;
}

.not-found__code {
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}

.not-found__title {
  font-size: var(--text-2xl);
}

.not-found__text {
  margin-bottom: var(--space-4);
  color: var(--color-text-muted);
}
</style>
