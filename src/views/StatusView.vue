<template>
  <div class="container container--wide status">
    <PageHeader
      eyebrow="Homelab"
      title="Server Status"
      description="집 서버에서 돌아가는 모든 서비스의 실시간 상태입니다. 트래픽·전원·배포·로그의 흐름과 호스트 자원, UPS, 백업을 한눈에 봅니다."
    />

    <StatusBanner
      :snapshot="data"
      :error="error"
      :loading="loading"
      :last-updated="lastUpdated"
      :refresh-seconds="STATUS_REFRESH_MS / 1000"
      @refresh="refresh"
    />

    <template v-if="data">
      <StatusSection title="흐름도" note="트래픽 · 전원 · 배포 · 로그가 지금 어디로 흐르는지">
        <div class="card flow-card">
          <FlowMap :data="data" @select="openDetail"/>
        </div>
      </StatusSection>

      <StatusSection title="최근 배포" note="Docker Hub 에 새 이미지가 올라온 순서 · 실시간">
        <DeployFeed/>
      </StatusSection>

      <StatusSection v-if="data.host" title="Proxmox 호스트">
        <HostSection
          :host="data.host"
          :storages="data.storages"
          :disks="data.disks"
          :ups="data.ups"
          :backup="data.backup"
          :history="history"
          @open-ups="openDetail(UPS_DETAIL_ID)"
        />
      </StatusSection>

      <StatusSection v-for="group in serviceGroups" :key="group.category" :title="group.title" :note="`${group.items.length}개`">
        <div class="service-grid">
          <ServiceCard
            v-for="service in group.items"
            :key="service.id"
            :service="service"
            :stats="statsById.get(service.id)"
            @select="openDetail(service.id)"
          />
        </div>
      </StatusSection>

      <StatusSection v-if="data.guests.length" title="가상 머신 · 컨테이너" :note="`${runningGuests} / ${data.guests.length} 실행 중`">
        <ul class="guest-grid">
          <GuestCard v-for="guest in data.guests" :key="guest.vmid" :guest="guest"/>
        </ul>
      </StatusSection>

      <p v-if="data.errors.length" class="errors">일부 항목을 읽지 못했습니다: {{ data.errors.join(' · ') }}</p>

      <UpsDetail v-if="detailId === UPS_DETAIL_ID && data.ups" :ups="data.ups" @close="closeDetail"/>
      <ServiceDetail
        v-else-if="selectedService"
        :service="selectedService"
        :stats="statsById.get(selectedService.id)"
        :traffic="data.traffic ? serviceTraffic(data.traffic, selectedService.id) : undefined"
        :window-minutes="data.traffic?.windowMinutes ?? 5"
        @close="closeDetail"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import PageHeader from '@/components/layout/PageHeader.vue';
import DeployFeed from '@/components/live/DeployFeed.vue';
import FlowMap from '@/components/status/FlowMap.vue';
import GuestCard from '@/components/status/GuestCard.vue';
import HostSection from '@/components/status/HostSection.vue';
import ServiceCard from '@/components/status/ServiceCard.vue';
import ServiceDetail from '@/components/status/ServiceDetail.vue';
import StatusBanner from '@/components/status/StatusBanner.vue';
import StatusSection from '@/components/status/StatusSection.vue';
import UpsDetail from '@/components/status/UpsDetail.vue';
import { STATUS_REFRESH_MS, useStatus } from '@/composables/useStatus';
import type { ServiceStatus } from '@/types/status';
import { runningGuestCount, serviceTraffic } from '@/utils/status';

/** Detail id the flow map and the UPS tile use for the UPS panel (everything else is a service id). */
const UPS_DETAIL_ID = 'ups';

const SERVICE_GROUPS: { category: ServiceStatus['category']; title: string }[] = [
  { category: 'apps', title: '서비스' },
  { category: 'platform', title: '인프라' },
];

const { data, error, loading, lastUpdated, history, uptime, refresh } = useStatus();

/* ----- detail panel ----- */
const detailId = ref<string | null>(null);

const selectedService = computed(() => data.value?.services.find((service) => service.id === detailId.value));

function openDetail(id: string) {
  detailId.value = id;
}

function closeDetail() {
  detailId.value = null;
}

/* ----- derived lists ----- */
const statsById = computed(() => new Map(uptime.value?.services.map((stats) => [stats.id, stats])));

const serviceGroups = computed(() =>
  SERVICE_GROUPS.map((group) => ({
    ...group,
    items: data.value?.services.filter((service) => service.category === group.category) ?? [],
  })).filter((group) => group.items.length > 0),
);

const runningGuests = computed(() => (data.value ? runningGuestCount(data.value) : 0));
</script>

<style scoped>
.status {
  display: grid;
  gap: var(--space-10);
}

/* PageHeader brings its own bottom margin; the grid gap replaces it here. */
.status > :first-child {
  margin-bottom: calc(-1 * var(--space-4));
}

.flow-card {
  padding: var(--space-4);
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: var(--space-3);
}

.guest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17.5rem), 1fr));
  gap: var(--space-3);
}

.errors {
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
}
</style>
