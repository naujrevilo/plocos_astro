<template>
  <div class="search-container relative" ref="searchContainer">
        <button @click="toggleSearch" type="button" class="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-text-primary transition hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
    </button>
    <div v-if="isSearchVisible" class="absolute top-full right-0 mt-2 w-80 p-4 bg-white rounded-lg border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700 z-50">
      <ais-instant-search :search-client="searchClient" index-name="plocos_netlify_app_gk0a52iptl_pages">
        <ais-search-box />
        <ais-hits>
          <template v-slot:item="{ item }">
            <h2><a :href="item.url" class="text-lg font-semibold text-gray-900 dark:text-white">{{ item.title }}</a></h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ item.content.substring(0, 150) }}...</p>
          </template>
        </ais-hits>
      </ais-instant-search>
    </div>
  </div>
</template>

<script>
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { AisInstantSearch, AisSearchBox, AisHits } from 'vue-instantsearch/vue3/es';

export default {
  components: {
    AisInstantSearch,
    AisSearchBox,
    AisHits,
  },
  data() {
    return {
      searchClient: algoliasearch(
        import.meta.env.PUBLIC_ALGOLIA_APP_ID,
        import.meta.env.PUBLIC_ALGOLIA_SEARCH_API_KEY
      ),
      
      isSearchVisible: false,
    };
  },
  methods: {
    toggleSearch() {
      this.isSearchVisible = !this.isSearchVisible;
    },
    handleClickOutside(event) {
      if (this.$refs.searchContainer && !this.$refs.searchContainer.contains(event.target)) {
        this.isSearchVisible = false;
      }
    },
    handleKeydown(event) {
        if (event.key === 'Escape' && this.isSearchVisible) {
            this.isSearchVisible = false;
        }
    },
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleKeydown);
  },
};
</script>