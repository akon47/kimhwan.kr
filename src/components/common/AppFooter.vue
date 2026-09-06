<template>
  <div class="footer-container">
    <div class="socials">
      <a href="https://github.com/akon47" target="_blank" :style="{ background: '#272e33' }">
        <img src="@/assets/github.svg" alt="GitHub"/>
      </a>
      <a href="https://www.linkedin.com/in/hwankim92/" target="_blank" :style="{ background: '#0073b1' }">
        <img src="@/assets/linkedin.svg" alt="LinkedIn"/>
      </a>
      <a href="mailto:akon47@naver.com" target="_blank" :style="{ background: '#b2e3ff' }">
        <img src="@/assets/mail.svg" alt="Mail"/>
      </a>
    </div>
    <div class="metas">
      <span>Copyright © 2022 - {{ currentYear }}. 김환(Kim,Hwan) all rights reserved.</span>
      <div class="counter">
        <img src="https://counter.kimhwan.kr?key=kimhwan.kr" alt="Visitors"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>

<style scoped>

.footer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.footer-container > .socials {
  border-bottom: 1px solid var(--border-color);
  height: 70px;

  display: grid;

  grid-auto-rows: auto;
  grid-template-rows: auto;

  grid-auto-flow: column;

  justify-content: center;
  align-items: center;

  column-gap: 10px;
}

.socials > a {
  display: block;
  width: 42px;
  height: 42px;
  border-radius: 10%;
}

.socials > a:hover {
  box-shadow: 0 0 10px var(--base-shadow-color);
}

.footer-container > .metas {
  flex-grow: 1;
  display: grid;
  justify-content: center;
  align-content: center;
  font-size: 12px;

  row-gap: 10px;
}

.metas > .counter {
  justify-self: center;
}

</style>
