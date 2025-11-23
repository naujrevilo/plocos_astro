<template>
  <div class="search-container relative">
    <button @click="toggleSearch" type="button" class="flex h-10 w-10 items-center justify-center rounded-full border bg-surface-elevated text-text-primary transition hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
    </button>
    <div v-if="isSearchVisible" class="absolute top-full right-0 mt-2 w-80 p-4 bg-white rounded-lg border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700 z-50">
      <input
        type="text"
        v-model="query"
        @input="search"
        placeholder="Buscar artículos..."
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
      />
      <div v-if="isLoading" class="mt-4 text-center">Cargando...</div>
      <ul v-if="results.length > 0" class="mt-4 space-y-2">
        <li v-for="result in results" :key="result.objectID">
          <a :href="`/blog/${result.objectID}`" class="block p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <h4 class="font-semibold text-text-primary">{{ result.title }}</h4>
          </a>
        </li>
      </ul>
      <div v-if="!isLoading && query && results.length === 0" class="mt-4 text-center text-gray-500">
        No se encontraron resultados para "{{ query }}".
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as algoliasearch from 'algoliasearch/lite';

const isSearchVisible = ref(false);
const query = ref('');
const results = ref([]);
const isLoading = ref(false);

const APP_ID = import.meta.env.PUBLIC_ALGOLIA_APP_ID;
const API_KEY = import.meta.env.PUBLIC_ALGOLIA_SEARCH_API_KEY;
const INDEX_NAME = import.meta.env.PUBLIC_ALGOLIA_INDEX_NAME;

const client = algoliasearch(APP_ID, API_KEY);
const index = client.initIndex(INDEX_NAME);

const toggleSearch = () => {
  isSearchVisible.value = !isSearchVisible.value;
};

let searchTimeout = null;

const search = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    if (query.value.trim() === '') {
      results.value = [];
      return;
    }
    isLoading.value = true;
    try {
      const { hits } = await index.search(query.value);
      results.value = hits;
    } catch (error) {
      console.error("Error searching Algolia:", error);
    } finally {
      isLoading.value = false;
    }
  }, 300); // Debounce search to avoid too many requests
};
</script>
