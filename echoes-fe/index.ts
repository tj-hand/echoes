/**
 * ECHOES Frontend Module
 *
 * Internationalization (i18n) and localization (l10n) for Spark Framework.
 *
 * @example Store usage
 * ```ts
 * import { useEchoesStore } from '@/echoes'
 *
 * const echoes = useEchoesStore()
 * await echoes.init()
 * await echoes.setLocale('pt')
 * ```
 *
 * @example Composable usage
 * ```vue
 * <script setup>
 * import { useEchoes } from '@/echoes'
 *
 * const { t, formatDate, formatCurrency, locale, setLocale } = useEchoes()
 * </script>
 *
 * <template>
 *   <h1>{{ t('app.title') }}</h1>
 *   <p>{{ formatDate(new Date()) }}</p>
 *   <p>{{ formatCurrency(99.99, 'USD') }}</p>
 *   <button @click="setLocale('pt')">Português</button>
 * </template>
 * ```
 *
 * @example Component usage
 * ```vue
 * <template>
 *   <Echo keypath="app.welcome" :params="{ name: userName }" />
 *   <Echo keypath="items.count" :count="itemCount" />
 * </template>
 * ```
 */

// Store
export { useEchoesStore } from './stores/echoes'

// Composables
export { useEchoes, useTranslate } from './composables/useEchoes'

// Components
export { default as Echo } from './components/Echo.vue'

// Types
export type {
  LocaleInfo,
  LocaleListResponse,
  TranslationResponse,
  DetectLocaleRequest,
  DetectLocaleResponse,
  TranslateRequest,
  TranslateResponse,
  TranslateBatchRequest,
  TranslateBatchResponse,
  DateFormat,
  NumberFormatOptions,
  TranslationParams,
  EchoesState,
  TranslationCacheEntry
} from './types'

// API Service (for advanced usage)
export {
  fetchLocales,
  fetchTranslations,
  detectLocale,
  translateKey,
  translateBatch,
  getCurrentLocale,
  checkHealth
} from './services/echoes-api'
