/**
 * ECHOES Composable
 *
 * Vue composable for translations and internationalization.
 * Provides t(), formatDate(), formatNumber(), formatCurrency() and more.
 */

import { computed, onMounted } from 'vue'
import { useEchoesStore } from '../stores/echoes'
import type { TranslationParams, DateFormat, NumberFormatOptions } from '../types'

/**
 * Options for the useEchoes composable
 */
export interface UseEchoesOptions {
  /** Auto-initialize the store on mount (default: true) */
  autoInit?: boolean
  /** Locale override (default: use store locale) */
  locale?: string
}

/**
 * ECHOES Composable
 *
 * @example
 * ```vue
 * <script setup>
 * import { useEchoes } from '@/echoes'
 *
 * const { t, formatDate, formatNumber, locale, setLocale } = useEchoes()
 * </script>
 *
 * <template>
 *   <h1>{{ t('app.title') }}</h1>
 *   <p>{{ t('app.welcome', { name: 'John' }) }}</p>
 *   <p>{{ formatDate(new Date()) }}</p>
 *   <p>{{ formatNumber(1234.56) }}</p>
 * </template>
 * ```
 */
export function useEchoes(options: UseEchoesOptions = {}) {
  const { autoInit = true } = options

  const store = useEchoesStore()

  // Auto-initialize on mount if requested
  onMounted(() => {
    if (autoInit && !store.initialized) {
      store.init()
    }
  })

  // ==========================================================================
  // Computed
  // ==========================================================================

  /** Current locale */
  const locale = computed(() => options.locale ?? store.locale)

  /** Available locales */
  const availableLocales = computed(() => store.availableLocales)

  /** Default locale */
  const defaultLocale = computed(() => store.defaultLocale)

  /** Loading state */
  const isLoading = computed(() => store.isLoading)

  /** Error state */
  const error = computed(() => store.error)

  /** Locale codes */
  const localeCodes = computed(() => store.localeCodes)

  // ==========================================================================
  // Translation Functions
  // ==========================================================================

  /**
   * Translate a key
   *
   * @param key - Translation key (dot notation)
   * @param params - Optional interpolation parameters
   * @param fallback - Optional fallback string
   *
   * @example
   * t('guardian.login.title')
   * t('app.welcome', { name: 'John' })
   * t('missing.key', {}, 'Fallback text')
   */
  function t(key: string, params?: TranslationParams, fallback?: string): string {
    return store.translate(key, params, fallback)
  }

  /**
   * Translate with pluralization
   *
   * @param key - Base translation key
   * @param count - Count for pluralization
   * @param params - Optional additional parameters
   *
   * @example
   * tc('items', 0) // "No items"
   * tc('items', 1) // "1 item"
   * tc('items', 5) // "5 items"
   */
  function tc(key: string, count: number, params?: TranslationParams): string {
    return store.translatePlural(key, count, params)
  }

  /**
   * Check if a translation key exists
   *
   * @param key - Translation key to check
   */
  function te(key: string): boolean {
    const result = store.translate(key)
    return !result.startsWith('[')
  }

  // ==========================================================================
  // Formatting Functions
  // ==========================================================================

  /**
   * Format a date according to locale conventions
   *
   * @param value - Date to format
   * @param format - Format style: 'short', 'medium', 'long', 'full'
   *
   * @example
   * formatDate(new Date()) // "Jan 25, 2026"
   * formatDate(new Date(), 'long') // "January 25, 2026"
   */
  function formatDate(
    value: Date | string | number,
    format: DateFormat = 'medium'
  ): string {
    const date = toDate(value)
    const currentLocale = locale.value

    const formatOptions: Intl.DateTimeFormatOptions = getDateFormatOptions(format)

    try {
      return new Intl.DateTimeFormat(currentLocale, formatOptions).format(date)
    } catch {
      // Fallback to ISO string
      return date.toISOString().split('T')[0]
    }
  }

  /**
   * Format a datetime according to locale conventions
   *
   * @param value - Datetime to format
   * @param format - Format style
   */
  function formatDateTime(
    value: Date | string | number,
    format: DateFormat = 'medium'
  ): string {
    const date = toDate(value)
    const currentLocale = locale.value

    const formatOptions: Intl.DateTimeFormatOptions = {
      ...getDateFormatOptions(format),
      ...getTimeFormatOptions(format)
    }

    try {
      return new Intl.DateTimeFormat(currentLocale, formatOptions).format(date)
    } catch {
      return date.toISOString()
    }
  }

  /**
   * Format a time according to locale conventions
   *
   * @param value - Time to format
   * @param format - Format style
   */
  function formatTime(
    value: Date | string | number,
    format: DateFormat = 'short'
  ): string {
    const date = toDate(value)
    const currentLocale = locale.value

    const formatOptions: Intl.DateTimeFormatOptions = getTimeFormatOptions(format)

    try {
      return new Intl.DateTimeFormat(currentLocale, formatOptions).format(date)
    } catch {
      return date.toISOString().split('T')[1].substring(0, 8)
    }
  }

  /**
   * Format relative time (e.g., "2 days ago", "in 3 hours")
   *
   * @param value - Date to compare
   * @param baseDate - Base date for comparison (default: now)
   */
  function formatRelativeTime(
    value: Date | string | number,
    baseDate: Date = new Date()
  ): string {
    const date = toDate(value)
    const diffMs = date.getTime() - baseDate.getTime()
    const diffSecs = Math.round(diffMs / 1000)
    const diffMins = Math.round(diffSecs / 60)
    const diffHours = Math.round(diffMins / 60)
    const diffDays = Math.round(diffHours / 24)
    const diffWeeks = Math.round(diffDays / 7)
    const diffMonths = Math.round(diffDays / 30)
    const diffYears = Math.round(diffDays / 365)

    const currentLocale = locale.value

    try {
      const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' })

      if (Math.abs(diffSecs) < 60) {
        return rtf.format(diffSecs, 'second')
      } else if (Math.abs(diffMins) < 60) {
        return rtf.format(diffMins, 'minute')
      } else if (Math.abs(diffHours) < 24) {
        return rtf.format(diffHours, 'hour')
      } else if (Math.abs(diffDays) < 7) {
        return rtf.format(diffDays, 'day')
      } else if (Math.abs(diffWeeks) < 4) {
        return rtf.format(diffWeeks, 'week')
      } else if (Math.abs(diffMonths) < 12) {
        return rtf.format(diffMonths, 'month')
      } else {
        return rtf.format(diffYears, 'year')
      }
    } catch {
      // Fallback
      return formatDate(date)
    }
  }

  /**
   * Format a number according to locale conventions
   *
   * @param value - Number to format
   * @param options - Formatting options
   *
   * @example
   * formatNumber(1234.56) // "1,234.56"
   * formatNumber(1234.56, { decimalPlaces: 0 }) // "1,235"
   */
  function formatNumber(
    value: number,
    options: NumberFormatOptions = {}
  ): string {
    const currentLocale = locale.value

    const formatOptions: Intl.NumberFormatOptions = {
      style: options.style ?? 'decimal'
    }

    if (options.decimalPlaces !== undefined) {
      formatOptions.minimumFractionDigits = options.decimalPlaces
      formatOptions.maximumFractionDigits = options.decimalPlaces
    }

    try {
      return new Intl.NumberFormat(currentLocale, formatOptions).format(value)
    } catch {
      return String(value)
    }
  }

  /**
   * Format a currency value according to locale conventions
   *
   * @param value - Amount to format
   * @param currency - Currency code (e.g., 'USD', 'EUR', 'BRL')
   *
   * @example
   * formatCurrency(1234.56, 'USD') // "$1,234.56"
   * formatCurrency(1234.56, 'BRL') // "R$ 1.234,56"
   */
  function formatCurrency(value: number, currency = 'USD'): string {
    const currentLocale = locale.value

    try {
      return new Intl.NumberFormat(currentLocale, {
        style: 'currency',
        currency
      }).format(value)
    } catch {
      return `${currency} ${value.toFixed(2)}`
    }
  }

  /**
   * Format a percentage according to locale conventions
   *
   * @param value - Decimal value (0.5 = 50%)
   * @param decimalPlaces - Number of decimal places
   *
   * @example
   * formatPercent(0.1234) // "12%"
   * formatPercent(0.1234, 1) // "12.3%"
   */
  function formatPercent(value: number, decimalPlaces = 0): string {
    const currentLocale = locale.value

    try {
      return new Intl.NumberFormat(currentLocale, {
        style: 'percent',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      }).format(value)
    } catch {
      return `${(value * 100).toFixed(decimalPlaces)}%`
    }
  }

  /**
   * Format a list according to locale conventions
   *
   * @param items - Array of items
   * @param type - List type: 'conjunction' (and), 'disjunction' (or)
   *
   * @example
   * formatList(['Apple', 'Orange', 'Banana']) // "Apple, Orange, and Banana"
   * formatList(['Apple', 'Orange'], 'disjunction') // "Apple or Orange"
   */
  function formatList(
    items: string[],
    type: 'conjunction' | 'disjunction' = 'conjunction'
  ): string {
    const currentLocale = locale.value

    try {
      return new Intl.ListFormat(currentLocale, {
        style: 'long',
        type
      }).format(items)
    } catch {
      // Fallback
      if (items.length === 0) return ''
      if (items.length === 1) return items[0]
      const last = items.pop()
      const separator = type === 'conjunction' ? ' and ' : ' or '
      return items.join(', ') + separator + last
    }
  }

  // ==========================================================================
  // Actions
  // ==========================================================================

  /**
   * Set the current locale
   *
   * @param newLocale - Locale code to set
   */
  async function setLocale(newLocale: string): Promise<void> {
    await store.setLocale(newLocale)
  }

  /**
   * Initialize the ECHOES system
   */
  async function init(): Promise<void> {
    await store.init()
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Convert various date inputs to Date object
   */
  function toDate(value: Date | string | number): Date {
    if (value instanceof Date) return value
    if (typeof value === 'number') return new Date(value)
    return new Date(value)
  }

  /**
   * Get Intl date format options for a format style
   */
  function getDateFormatOptions(format: DateFormat): Intl.DateTimeFormatOptions {
    switch (format) {
      case 'short':
        return { year: '2-digit', month: 'numeric', day: 'numeric' }
      case 'medium':
        return { year: 'numeric', month: 'short', day: 'numeric' }
      case 'long':
        return { year: 'numeric', month: 'long', day: 'numeric' }
      case 'full':
        return { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
      default:
        return { year: 'numeric', month: 'short', day: 'numeric' }
    }
  }

  /**
   * Get Intl time format options for a format style
   */
  function getTimeFormatOptions(format: DateFormat): Intl.DateTimeFormatOptions {
    switch (format) {
      case 'short':
        return { hour: 'numeric', minute: '2-digit' }
      case 'medium':
        return { hour: 'numeric', minute: '2-digit', second: '2-digit' }
      case 'long':
        return { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }
      case 'full':
        return { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'long' }
      default:
        return { hour: 'numeric', minute: '2-digit' }
    }
  }

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    locale,
    availableLocales,
    defaultLocale,
    localeCodes,
    isLoading,
    error,

    // Translation functions
    t,
    tc,
    te,

    // Formatting functions
    formatDate,
    formatDateTime,
    formatTime,
    formatRelativeTime,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatList,

    // Actions
    setLocale,
    init
  }
}

// ==========================================================================
// Shorthand Export
// ==========================================================================

/**
 * Shorthand for getting the translate function
 *
 * @example
 * const t = useTranslate()
 * t('app.title')
 */
export function useTranslate() {
  const { t } = useEchoes({ autoInit: false })
  return t
}
