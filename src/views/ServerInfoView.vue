<template>
  <div class="server-info-container">
    <div class="server-info">
      <div class="title">
        <h4>
          📅 2022.09 ~ {{now}}
        </h4>
      </div>
      <div class="content">
        <h5 class="os-title">
          OS
        </h5>
        <span>Proxmox Virtual Environment 7.3-3</span>
        <h5 class="processor-title">
          CPU
        </h5>
        <span>INTEL Core i5-12400</span>
        <h5 class="memory-title">
          MEMORY
        </h5>
        <span>DDR4 16GB PC4-25600 x 2</span>
        <br/>
        <span>DDR4 32GB PC4-25600 x 2</span>
        <h5 class="ssd-title">
          STORAGE
        </h5>
        <span>SAMSUNG 980 NVMe M.2 SSD 1 TB</span>
        <br/>
        <span>Western Digital HDD 8 TB</span>
        <h5 class="ups-title">
          UPS
        </h5>
        <span>APC BX1200MI-GR</span>
        <h5 class="services-title">
          Running Services
        </h5>
        <div class="services">
          <div><a href="https://kimhwan.kr/" target="_blank">Kimhwan.kr</a></div>
          <div><a href="https://blog.kimhwan.kr/" target="_blank">Hwan'Story</a></div>
          <div><a href="https://hwanscord.kimhwan.kr/" target="_blank">Hwanscord</a></div>
          <div><a href="https://shootgame.kimhwan.kr/" target="_blank">ShootGame</a></div>
          <div><a href="https://screenshare.kimhwan.kr/" target="_blank">SreenShare</a></div>
          <div><a href="https://github.com/akon47/visit-counter" target="_blank">VisitCounter</a></div>
          <div><a href="https://build.kimhwan.kr/" target="_blank">Jenkins</a></div>
          <div>Postfix</div>
          <div>Nginx API Gateway</div>
          <div><a href="https://elk.kimhwan.kr/" target="_blank">ELK-Stack</a></div>
        </div>
      </div>
      <div class="images">
        <a href="https://user-images.githubusercontent.com/49547202/189513989-ffb8d70e-af79-429a-abeb-da6c6a4235c2.png"
           target="_blank">
          <img
              src="https://user-images.githubusercontent.com/49547202/189513989-ffb8d70e-af79-429a-abeb-da6c6a4235c2.png"/>
        </a>
        <div>
          <a href="https://user-images.githubusercontent.com/49547202/213860127-a3647be9-e1b6-4633-8f08-7a3c9febeadb.png"
             target="_blank">
            <img
                src="https://user-images.githubusercontent.com/49547202/213860127-a3647be9-e1b6-4633-8f08-7a3c9febeadb.png"/>
          </a>
        </div>
      </div>
    </div>
    <div class="server-info">
      <div class="title">
        <h4>
          📅 2021.04 ~ {{now}}
        </h4>
      </div>
      <div class="content">
        <h5 class="os-title">
          OS
        </h5>
        <span>Proxmox Virtual Environment 7.3-3</span>
        <br/>
        <span><del>Ubuntu Linux Server 20.04.4 LTS</del> ~ 2022.09</span>
        <h5 class="processor-title">
          CPU
        </h5>
        <span>AMD Ryzen 3 PRO 4350G</span>
        <h5 class="memory-title">
          MEMORY
        </h5>
        <span>DDR4 8GB PC4-25600 x 2</span>
        <h5 class="ssd-title">
          STORAGE
        </h5>
        <span>SAMSUNG 980 NVMe M.2 SSD 500 GB</span>
        <br/>
        <span>SAMSUNG 850 PRO 256 GB</span>
        <br/>
        <span>SAMSUNG 850 EVO 250 GB</span>
        <h5 class="ups-title">
          UPS
        </h5>
        <span>APC BX1200MI-GR</span>
        <h5 class="services-title">
          Running Services
        </h5>
        <div class="services">
          <div>Proxmox Backup Server</div>
        </div>
      </div>
      <div class="images">
        <a href="https://user-images.githubusercontent.com/49547202/171973908-452a9e3c-5ef4-40a5-9e61-711bf829fd86.png" target="_blank">
          <img src="https://user-images.githubusercontent.com/49547202/171973908-452a9e3c-5ef4-40a5-9e61-711bf829fd86.png"/>
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import dayjs from 'dayjs';

export default defineComponent({
  name: 'ServerInfoView',
  data() {
    return {
      now: '',
      timerId: undefined as number | undefined
    }
  },
  methods: {
    updateNow() {
      this.now = dayjs(new Date()).format('YYYY.MM.DD HH:mm:ss');
    }
  },
  mounted() {
    this.updateNow();
    this.timerId = setInterval(this.updateNow, 500);
  },
  unmounted() {
    if(this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }
});
</script>

<style scoped>

.server-info-container {
  display: grid;

  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: repeat(2, auto);

  grid-row-gap: 20px;
}

.server-info {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  box-sizing: border-box;

  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;

  align-items: start;
  align-content: start;
}

.server-info > .title {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
  margin-bottom: 10px;
  grid-column: 1 / span 2;
}

.server-info > .content {
  grid-column: 1 / span 1;
  min-width: 300px;
  max-width: 400px;
}

.server-info > .images {
  grid-column: 2 / span 1;
  border-left: 1px solid var(--border-color);
  height: 100%;
  margin-left: 10px;
  padding-left: 10px;
  box-sizing: border-box;
}

.images img {
  width: 200px;
}

@media (max-width: 720px) {
  .server-info > .images {
    display: none;
  }
}

.content > span {
  padding: 0 5px;
  font-size: 14px;
  line-height: 35px;
}

.content > .services {
  display: flex;
  flex-wrap: wrap;
  flex-basis: 0px;
  flex-shrink: 0;
  gap: 10px;
  font-size: 14px;
  margin-top: 10px;
}

.content > .services > div {
  padding: 2px 10px;
  border-radius: 5px;
  border: 1px solid var(--border-color);
}

.os-title::before {
  content: ''
}

.content h5 {
  display: flex;
  flex-direction: row;

  align-items: center;
}

.content h5::before {
  content: '';
  width: 16px;
  height: 16px;
  margin-right: 5px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.os-title::before {
  background-image: url('@/assets/cd.png');
}

.processor-title::before {
  background-image: url('@/assets/processor.svg');
}

.memory-title::before {
  background-image: url('@/assets/memory.png');
}

.ssd-title::before {
  background-image: url('@/assets/ssd.svg');
}

.ups-title::before {
  content: '🔋' !important;
  margin-left: -2px !important;
  margin-right: 7px !important;
  height: auto !important;
}

.services-title::before {
  background-image: url('@/assets/apps.svg');
}

</style>
