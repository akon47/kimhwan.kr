<template>
  <div class="server-info-container">
    <div class="server-info">
      <div class="title">
        <h4>
          📅 2022.09 ~ Present
        </h4>
      </div>
      <div class="content">
        <h5>
          OS
        </h5>
        <span>Proxmox Virtual Environment 7.2</span>
        <h5>
          CPU
        </h5>
        <span>INTEL Core i5-12400</span>
        <h5>
          MEMORY
        </h5>
        <span>DDR4 16GB PC4-25600 x 2</span>
        <h5>
          SSD
        </h5>
        <span>SAMSUNG 980 NVMe M.2 SSD 1 TB</span>
        <h5>
          Running Services
        </h5>
        <div class="services">
          <div><a href="https://kimhwan.kr/" target="_blank">Kimhwan.kr</a></div>
          <div><a href="https://blog.kimhwan.kr/" target="_blank">Hwan'Story</a></div>
          <div><a href="https://hwanscord.kimhwan.kr/" target="_blank">Hwanscord</a></div>
          <div><a href="https://shootgame.kimhwan.kr/" target="_blank">ShootGame</a></div>
          <div><a href="https://github.com/akon47/visit-counter" target="_blank">VisitCounter</a></div>
          <div>Jenkins</div>
          <div>Postfix</div>
          <div>Nginx API Gateway</div>
        </div>
      </div>
      <div class="images">
        <a href="https://user-images.githubusercontent.com/49547202/189513989-ffb8d70e-af79-429a-abeb-da6c6a4235c2.png"
           target="_blank">
          <img
              src="https://user-images.githubusercontent.com/49547202/189513989-ffb8d70e-af79-429a-abeb-da6c6a4235c2.png"
              width="200px"/>
        </a>
        <div>
          <a href="https://user-images.githubusercontent.com/49547202/189514036-82c4093b-e2f7-418a-97b6-7694490b404a.png"
             target="_blank">
            <img
                src="https://user-images.githubusercontent.com/49547202/189514036-82c4093b-e2f7-418a-97b6-7694490b404a.png"
                width="200px"/>
          </a>
        </div>
      </div>
    </div>
    <div class="server-info">
      <div class="title">
        <h4>
          📅 2021.04 ~ Present
        </h4>
      </div>
      <div class="content">
        <h5>
          OS
        </h5>
        <span>Ubuntu Linux Server 20.04.4 LTS</span>
        <h5>
          CPU
        </h5>
        <span>AMD Ryzen 3 PRO 4350G</span>
        <h5>
          MEMORY
        </h5>
        <span>DDR4 8GB PC4-25600 x 2</span>
        <h5>
          SSD
        </h5>
        <span>SAMSUNG 980 NVMe M.2 SSD 500 GB</span>
        <h5>
          CASE & MAINBOARD & POWER
        </h5>
        <span>ASRock DeskMini X300 120W</span>
        <h5>
          Running Services
        </h5>
        <span>None currently</span>
      </div>
      <div class="images">
        <a href="https://user-images.githubusercontent.com/49547202/171973908-452a9e3c-5ef4-40a5-9e61-711bf829fd86.png"
           target="_blank">
          <img
              src="https://user-images.githubusercontent.com/49547202/171973908-452a9e3c-5ef4-40a5-9e61-711bf829fd86.png"
              width="200px"/>
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ServerInfoView',
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

</style>