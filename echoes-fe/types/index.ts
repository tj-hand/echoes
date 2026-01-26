/**
 * ECHOES Frontend Types
 *
 * TypeScript type definitions for the internationalization system.
 */

/**
 * Locale information
 */
export interface LocaleInfo {
  code: string
  name: string
  native_name: string
}

/**
 * Response from the locales endpoint
 */
export interface LocaleListResponse {
  locales: LocaleInfo[]
  default: string
}

/**
 * Response from the translations endpoint
 */
export interface TranslationResponse {
  locale: string
  translations: Record<string, unknown>
}

/**
 * Request to detect locale
 */
export interface DetectLocaleRequest {
  accept_language: string
}

/**
 * Response from locale detection
 */
export interface DetectLocaleResponse {
  detected: string
  supported: boolean
}

/**
 * Request to translate a single key
 */
export interface TranslateRequest {
  key: string
  locale?: string
  params?: Record<string, unknown>
}

/**
 * Response from single translation
 */
export interface TranslateResponse {
  key: string
  locale: string
  text: string
}

/**
 * Request for batch translation
 */
export interface TranslateBatchRequest {
  keys: string[]
  locale?: string
}

/**
 * Response from batch translation
 */
export interface TranslateBatchResponse {
  locale: string
  translations: Record<string, string>
}

/**
 * Date format options
 */
export type DateFormat = 'short' | 'medium' | 'long' | 'full'

/**
 * Number format options
 */
export interface NumberFormatOptions {
  decimalPlaces?: number
  currency?: string
  style?: 'decimal' | 'currency' | 'percent'
}

/**
 * Translation parameters for interpolation
 */
export type TranslationParams = Record<string, string | number | boolean>

/**
 * Echoes store state
 */
export interface EchoesState {
  /** Current active locale */
  locale: string
  /** Available locales */
  availableLocales: LocaleInfo[]
  /** Loaded translations by locale */
  translations: Record<string, Record<string, unknown>>
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: string | null
  /** Whether initial detection has been done */
  initialized: boolean
}

/**
 * Cache entry for translations
 */
export interface TranslationCacheEntry {
  translations: Record<string, unknown>
  timestamp: number
  module?: string
}
