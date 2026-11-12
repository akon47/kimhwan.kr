<template>
  <div class="container container--wide status">
    <PageHeader :eyebrow="t.status.eyebrow" :title="t.status.title" :description="t.status.description"/>

    <StatusBanner
      :snapshot="data"
      :error="error"
      :loading="loading"
      :last-updated="lastUpdated"
      :refresh-seconds="STATUS_REFRESH_MS / 1000"
      @refresh="refresh"
    />

    <template v-if="data">
      <StatusSection :title="sections.flow" :note="sections.flowNote">
        <div class="card flow-card">
          <FlowMap :data="data" @select="openDetail"/>
        </div>
      </StatusSection>

      <StatusSection :title="sections.deploys" :note="sections.deploysNote">
        <DeployFeed/>
      </StatusSection>

      <StatusSection v-if="data.host" :title="sections.host">
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

      <StatusSection v-for="group in serviceGroups" :key="group.category" :title="sections[group.category]" :note="sections.count(group.items.length)">
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

      <StatusSection v-if="data.guests.length" :title="sections.guests" :note="sections.running(runningGuests, data.guests.length)">
        <ul class="guest-grid">
          <GuestCard v-for="guest in data.guests" :key="guest.vmid" :guest="guest"/>
        </ul>
      </StatusSection>

      <p v-if="data.errors.length" class="errors">{{ t.status.partialErrors(data.errors.join(' · ')) }}</p>

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
import { useI18n } from '@/i18n';
import type { ServiceStatus } from '@/types/status';
import { runningGuestCount, serviceTraffic } from '@/utils/status';

/** Detail id the flow map and the UPS tile use for the UPS panel (everything else is a service id). */
const UPS_DETAIL_ID = 'ups';

/** The service sections, in display order. Their titles are in the texts under the same names. */
const SERVICE_CATEGORIES: ServiceStatus['category'][] = ['apps', 'platform'];

const { t } = useI18n();
const sections = computed(() => t.value.status.sections);

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
  SERVICE_CATEGORIES.map((category) => ({
    category,
    items: data.value?.services.filter((service) => service.category === category) ?? [],
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
