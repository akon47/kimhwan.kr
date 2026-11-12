<template>
  <div class="container home">
    <section class="hero">
      <img class="hero__avatar" :src="site.avatarUrl" alt="" width="72" height="72"/>
      <h1 class="hero__title">
        Hi, I'm <span class="hero__name">{{ site.name }}</span>
      </h1>
      <p class="hero__lead">
        {{ site.role }}. {{ site.tagline }}
        Desktop apps, web services, and the home server they run on.
      </p>
      <div class="hero__actions">
        <RouterLink to="/projects" class="btn btn--primary">
          View projects
          <AppIcon name="arrow-right" :size="16"/>
        </RouterLink>
        <a class="btn" :href="githubUrl" target="_blank" rel="noopener">
          <AppIcon name="github" :size="16"/>
          GitHub
        </a>
      </div>
    </section>

    <HomeStatusCard/>

    <section class="section">
      <header class="section__head">
        <div>
          <p class="eyebrow">Open source</p>
          <h2 class="section__title">Recent projects</h2>
        </div>
        <RouterLink to="/projects" class="link section__more">
          All {{ projects.length }} projects
          <AppIcon name="arrow-right" :size="14"/>
        </RouterLink>
      </header>
      <div class="project-grid">
        <ProjectCard v-for="project in featuredProjects" :key="project.title" :project="project"/>
      </div>
    </section>

    <section class="section">
      <header class="section__head">
        <div>
          <p class="eyebrow">Homelab</p>
          <h2 class="section__title">Self-hosted, end to end</h2>
          <p class="section__lead">
            This site and most of the projects above are served from a single machine at home.
          </p>
        </div>
        <RouterLink to="/status" class="link section__more">
          See it live
          <AppIcon name="arrow-right" :size="14"/>
        </RouterLink>
      </header>
      <ul class="feature-grid">
        <li v-for="feature in homelabFeatures" :key="feature.title" class="card feature">
          <span class="feature__icon" aria-hidden="true">
            <AppIcon :name="feature.icon"/>
          </span>
          <h3 class="feature__title">{{ feature.title }}</h3>
          <p class="feature__summary">{{ feature.summary }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import HomeStatusCard from '@/components/home/HomeStatusCard.vue';
import ProjectCard from '@/components/projects/ProjectCard.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { site } from '@/config/site';
import { homelabFeatures } from '@/data/homelab';
import { projects } from '@/data/projects';

const FEATURED_COUNT = 3;

const githubUrl = `https://github.com/${site.githubUser}`;
const featuredProjects = projects.slice(0, FEATURED_COUNT);
</script>

<style scoped>
.home {
  display: grid;
  gap: var(--space-16);
}

/* ----- hero ----- */
.hero {
  position: relative;
  display: grid;
  justify-items: start;
  gap: var(--space-5);
  padding-block: var(--space-10) 0;
}

/* soft colour wash behind the hero */
.hero::before {
  content: '';
  position: absolute;
  inset: -6rem -20% auto;
  z-index: -1;
  height: 26rem;
  background:
    radial-gradient(40% 60% at 20% 30%, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent 70%),
    radial-gradient(35% 55% at 65% 20%, color-mix(in srgb, #db2777 10%, transparent), transparent 70%);
  filter: blur(20px);
  pointer-events: none;
}

.hero__avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--color-surface-muted);
  box-shadow:
    0 0 0 1px var(--color-border),
    var(--shadow-md);
}

.hero__title {
  font-size: var(--text-3xl);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.035em;
}

.hero__name {
  background: var(--gradient-accent);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.hero__lead {
  max-width: 36rem;
  color: var(--color-text-muted);
  font-size: var(--text-lg);
  word-break: normal;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

/* ----- sections ----- */
.section {
  display: grid;
  gap: var(--space-6);
}

.section__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3) var(--space-6);
}

.section__title {
  margin-top: var(--space-1);
  font-size: var(--text-2xl);
}

.section__lead {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
}

.section__more {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.project-grid,
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-4);
}

/* ----- homelab features ----- */
.feature {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  padding: var(--space-5);
}

.feature__icon {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  margin-bottom: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.feature__title {
  font-size: var(--text-md);
}

.feature__summary {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  word-break: normal;
}
</style>
