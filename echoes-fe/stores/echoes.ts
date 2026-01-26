/**
 * ECHOES Pinia Store
 *
 * Central state management for internationalization.
 * Manages locale state, translation caching, and provides reactive access.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LocaleInfo, TranslationParams, TranslationCacheEntry } from '../types'
import { fetchLocales, fetchTranslations } from '../services/echoes-api'

/**
 * Storage key for persisted locale preference
 */
const LOCALE_STORAGE_KEY = 'echoes:locale'

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000

/**
 * Default fallback locale
 */
const DEFAULT_LOCALE = 'en'

/**
 * ECHOES Store
 *
 * Provides centralized state for:
 * - Current locale
 * - Available locales
 * - Cached translations
 * - Loading/error states
 */
export const useEchoesStore = defineStore('echoes', () => {
  // ==========================================================================
  // State
  // ==========================================================================

  /** Current active locale */
  const locale = ref<string>(DEFAULT_LOCALE)

  /** Available locales from backend */
  const availableLocales = ref<LocaleInfo[]>([])

  /** Default locale from backend */
  const defaultLocale = ref<string>(DEFAULT_LOCALE)

  /** Cached translations by locale */
  const translationCache = ref<Record<string, TranslationCacheEntry>>({})

  /** Loading state */
  const isLoading = ref<boolean>(false)

  /** Error message if any */
  const error = ref<string | null>(null)

  /** Whether store has been initialized */
  const initialized = ref<boolean>(false)

  // ==========================================================================
  // Getters
  // ==========================================================================

  /** Get translations for current locale */
  const translations = computed(() => {
    const entry = translationCache.value[locale.value]
    return entry?.translations ?? {}
  })

  /** Get locale codes */
  const localeCodes = computed(() =>
    availableLocales.value.map(l => l.code)
  )

  /** Check if a locale is available */
  const isLocaleAvailable = computed(() => (code: string) =>
    localeCodes.value.includes(code)
  )

  /** Check if translations are cached and valid */
  const hasValidCache = computed(() => (localeCode: string) => {
    const entry = translationCache.value[localeCode]
    if (!entry) return false
    return Date.now() - entry.timestamp < CACHE_TTL
  })

  // ==========================================================================
  // Actions
  // ==========================================================================

  /**
   * Initialize the store
   * Loads available locales and detects/restores user's locale preference
   */
  async function init(): Promise<void> {
    if (initialized.value) return

    isLoading.value = true
    error.value = null

    try {
      // Fetch available locales from backend
      const response = await fetchLocales()
      availableLocales.value = response.locales
      defaultLocale.value = response.default

      // Restore saved locale or detect from browser
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
      const detectedLocale = detectBrowserLocale()

      if (savedLocale && isLocaleSupported(savedLocale)) {
        locale.value = savedLocale
      } else if (detectedLocale && isLocaleSupported(detectedLocale)) {
        locale.value = detectedLocale
      } else {
        locale.value = response.default
      }

      // Load translations for the selected locale
      await loadTranslations(locale.value)

      initialized.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to initialize ECHOES'
      console.error('[ECHOES] Initialization failed:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Detect locale from browser settings
   */
  function detectBrowserLocale(): string | null {
    const languages = navigator.languages || [navigator.language]

    for (const lang of languages) {
      // Get base language code (e.g., 'pt-BR' -> 'pt')
      const baseCode = lang.split('-')[0].toLowerCase()
      if (isLocaleSupported(baseCode)) {
        return baseCode
      }
    }

    return null
  }

  /**
   * Check if a locale is supported
   */
  function isLocaleSupported(code: string): boolean {
    return availableLocales.value.some(l => l.code === code)
  }

  /**
   * Set the current locale
   *
   * @param newLocale - The locale code to set
   * @param persist - Whether to persist to localStorage (default: true)
   */
  async function setLocale(newLocale: string, persist = true): Promise<void> {
    if (!isLocaleSupported(newLocale)) {
      console.warn(`[ECHOES] Locale "${newLocale}" is not supported`)
      return
    }

    locale.value = newLocale

    if (persist) {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
    }

    // Load translations if not cached
    if (!hasValidCache.value(newLocale)) {
      await loadTranslations(newLocale)
    }

    // Update HTML lang attribute
    document.documentElement.lang = newLocale
  }

  /**
   * Load translations for a locale
   *
   * @param localeCode - Locale to load translations for
   * @param module - Optional module filter
   * @param force - Force reload even if cached
   */
  async function loadTranslations(
    localeCode: string,
    module?: string,
    force = false
  ): Promise<void> {
    // Check cache unless forced
    if (!force && hasValidCache.value(localeCode)) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetchTranslations(localeCode, module)

      translationCache.value[localeCode] = {
        translations: response.translations,
        timestamp: Date.now(),
        module
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load translations'
      console.error(`[ECHOES] Failed to load translations for ${localeCode}:`, e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get a nested value from the translations using dot notation
   *
   * @param key - Dot-notated key (e.g., 'guardian.login.title')
   * @param localeCode - Optional locale (defaults to current)
   */
  function getNestedValue(key: string, localeCode?: string): string | null {
    const targetLocale = localeCode || locale.value
    const entry = translationCache.value[targetLocale]

    if (!entry) return null

    const keys = key.split('.')
    let value: unknown = entry.translations

    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return null
      }
    }

    return typeof value === 'string' ? value : null
  }

  /**
   * Interpolate parameters into a template string
   *
   * @param template - Template with {param} placeholders
   * @param params - Parameters to interpolate
   */
  function interpolate(template: string, params: TranslationParams): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = params[key]
      return value !== undefined ? String(value) : match
    })
  }

  /**
   * Translate a key
   *
   * @param key - Translation key
   * @param params - Interpolation parameters
   * @param fallback - Fallback string if key not found
   */
  function translate(
    key: string,
    params?: TranslationParams,
    fallback?: string
  ): string {
    // Try current locale first
    let value = getNestedValue(key, locale.value)

    // Fallback to default locale
    if (value === null && locale.value !== defaultLocale.value) {
      value = getNestedValue(key, defaultLocale.value)
    }

    // Return fallback or key marker
    if (value === null) {
      return fallback ?? `[${key}]`
    }

    // Interpolate parameters
    if (params) {
      return interpolate(value, params)
    }

    return value
  }

  /**
   * Translate with pluralization
   *
   * @param key - Base translation key
   * @param count - Count for pluralization
   * @param params - Additional parameters
   */
  function translatePlural(
    key: string,
    count: number,
    params?: TranslationParams
  ): string {
    const pluralForm = getPluralForm(count, locale.value)
    const pluralKey = `${key}.${pluralForm}`
    const allParams = { count, ...params }

    let result = translate(pluralKey, allParams)

    // Fallback to 'other' if specific form not found
    if (result.startsWith('[') && pluralForm !== 'other') {
      result = translate(`${key}.other`, allParams)
    }

    return result
  }

  /**
   * Get plural form based on count and locale
   */
  function getPluralForm(count: number, localeCode: string): string {
    const baseLocale = localeCode.split('-')[0]

    if (count === 0) return 'zero'

    // French: 0 and 1 are singular
    if (baseLocale === 'fr') {
      return count <= 1 ? 'one' : 'other'
    }

    // Russian: complex rules
    if (baseLocale === 'ru') {
      const mod10 = count % 10
      const mod100 = count % 100
      if (mod10 === 1 && mod100 !== 11) return 'one'
      if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return 'few'
      return 'many'
    }

    // Default (English, Portuguese, Spanish, German, etc.)
    return count === 1 ? 'one' : 'other'
  }

  /**
   * Clear the translation cache
   *
   * @param localeCode - Optional specific locale to clear
   */
  function clearCache(localeCode?: string): void {
    if (localeCode) {
      delete translationCache.value[localeCode]
    } else {
      translationCache.value = {}
    }
  }

  /**
   * Preload translations for multiple locales
   *
   * @param localeCodes - Array of locale codes to preload
   */
  async function preloadLocales(localeCodes: string[]): Promise<void> {
    await Promise.all(
      localeCodes.map(code => loadTranslations(code))
    )
  }

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    locale,
    availableLocales,
    defaultLocale,
    isLoading,
    error,
    initialized,

    // Getters
    translations,
    localeCodes,
    isLocaleAvailable,
    hasValidCache,

    // Actions
    init,
    setLocale,
    loadTranslations,
    translate,
    translatePlural,
    clearCache,
    preloadLocales,
    detectBrowserLocale,
    isLocaleSupported
  }
})
