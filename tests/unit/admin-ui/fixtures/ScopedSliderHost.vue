<template>
  <div class="host">
    <SliderField
      v-model="value"
      class="slider"
      aria-label="Speed"
      :min="0"
      :max="200"
      :default-value="50"
      @update:model-value="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SliderField from '../../../../server/admin/app/components/ui/SliderField.vue';

const value = ref(80);
const seen = ref<number[]>([]);
function onUpdate() {
  seen.value.push(value.value);
}
defineExpose({ value, seen });
</script>

<style scoped>
.slider {
  height: 3px;
}
</style>
