<template>
  <div class="header-container">
    <router-link to="/">
      <div class="title-container">
        <div class="logo"/>
        <span class="title">
          Kim, Hwan
        </span>
      </div>
    </router-link>
    <div class="menu-container">
      <div class="themes">
        <input id="theme-button" type="checkbox" :checked="isDarkTheme" @change="toggleTheme"/>
        <label class="switch" for="theme-button"/>
      </div>
      <router-link to="/opensource-projects">
        OpenSource Projects
      </router-link>
      <router-link to="/server-info">
        Server Info
      </router-link>
      <router-link to="/about">
        About
      </router-link>
      <div class="icon-menus">
        <router-link to="/opensource-projects">
          🚀
        </router-link>
        <router-link to="/server-info">
          🖥
        </router-link>
        <router-link to="/about">
          👨‍💻
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';

export default defineComponent({
  name: 'AppHeader',
  computed: {
    isDarkTheme(): boolean {
      return store.getters['commonStore/isDarkTheme'] ?? false;
    },
  },
  methods: {
    toggleTheme() {
      store.dispatch('commonStore/toggleTheme');
    },
  },
});
</script>

<style scoped>

.header-container {
  display: grid;
  grid-template-columns: auto minmax(auto, 800px);
  grid-template-rows: 1fr;
  padding: 5px 20px;
  box-sizing: border-box;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.header-container a {
  text-decoration: none;
  color: inherit;
}

.header-container a:visited {
  color: inherit;
}

.header-container .title-container {
  display: flex;
  align-items: center;
}

.title-container > .logo {
  background-image: url("https://avatars.githubusercontent.com/u/49547202");
  background-size: cover;
  width: 50px;
  height: 50px;
  border-radius: 100%;
}

.title-container > .title {
  margin-left: 10px;
  font-size: 24px;
  font-weight: bold;
}

@media (max-width: 500px) {
  .title-container > .title {
    display: none;
  }
}

.header-container > .menu-container {
  justify-self: right;
  display: grid;
  grid-auto-columns: minmax(0, auto);
  grid-template-rows: 1fr;
  grid-auto-flow: column;
  grid-column-gap: 5px;
}

.menu-container a {
  color: var(--base-color);
  padding: 5px 15px;
  border-radius: 5px;
  box-sizing: border-box;
  transition: 0.2s;
  display: flex;
  align-items: center;
  text-align: center;
}

.icon-menus {
  display: none;
}

@media (max-width: 720px) {
  .menu-container > a {
    display: none;
  }
  .icon-menus {
    display: flex;
  }
}

.menu-container a:hover {
  cursor: pointer;
  background: var(--menu-hover-color);
}

.menu-container a.router-link-exact-active {
  background: var(--menu-hover-color);
}

.themes {
  align-self: center;
}

.themes input {
  display: none;
}

.switch {
  background-image: url(@/assets/light-mode.svg);
  background-size: 25px 25px;
  background-position: center;
  background-repeat: no-repeat;
  display: block;
  width: 35px;
  height: 35px;
  color: white;
  border-radius: 100%;
  transform: rotate(90deg);
  transition: 0.5s;
}

.themes input:checked + .switch {
  background-image: url(@/assets/dark-mode.svg);
  transform: rotate(0deg);
}

.themes .switch:hover {
  cursor: pointer;
  background-color: var(--hover-color);
}

</style>