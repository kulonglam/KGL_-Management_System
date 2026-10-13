<template>
  <div ref="panelRef" class="chart-panel" :class="{ 'chart-panel-sm': small }">
    <component :is="chart" ref="chartRef" :key="renderKey" :data="data" :options="options" />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  chart: { type: Object, required: true },
  data: { type: Object, required: true },
  options: { type: Object, required: true },
  small: { type: Boolean, default: false }
});

const panelRef = ref(null);
const chartRef = ref(null);
let observer;

const renderKey = computed(() => {
  const labels = Array.isArray(props.data?.labels) ? props.data.labels.join('\u0001') : '';
  const lengths = Array.isArray(props.data?.datasets)
    ? props.data.datasets.map((set) => (Array.isArray(set.data) ? set.data.length : 0)).join(',')
    : '';
  return `${labels}:${lengths}`;
});

const fitChart = () => {
  const instance = chartRef.value?.chart;
  const panel = panelRef.value;
  if (!instance || !panel) return;
  const width = panel.clientWidth;
  const height = panel.clientHeight;
  if (width > 0 && height > 0) {
    instance.resize(width, height);
  }
};

onMounted(async () => {
  await nextTick();
  fitChart();
  if (typeof ResizeObserver === 'undefined' || !panelRef.value) return;
  observer = new ResizeObserver(() => fitChart());
  observer.observe(panelRef.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
});

watch(renderKey, async () => {
  await nextTick();
  fitChart();
});
</script>
