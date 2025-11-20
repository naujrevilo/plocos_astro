<template>
  <div class="search-container relative">
    <button @click="toggleSearch" type="button" class="flex h-10 w-10 items-center justify-center rounded-full border bg-surface-elevated text-text-primary transition hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
    </button>
    <div v-if="isSearchVisible" class="absolute top-full right-0 mt-2 w-80 p-4 bg-white rounded-lg border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700 z-50">
      Search box will be here.
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isSearchVisible = ref(false);

const toggleSearch = () => {
  isSearchVisible.value = !isSearchVisible.value;
};
</script>