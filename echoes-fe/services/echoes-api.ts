/**
 * ECHOES API Service
 *
 * HTTP client for the ECHOES backend translation service.
 * Uses Evoke client when available, falls back to native fetch.
 */

import type {
  LocaleListResponse,
  TranslationResponse,
  DetectLocaleResponse,
  TranslateResponse,
  TranslateBatchResponse,
  TranslationParams
} from '../types'

/**
 * Base API path for ECHOES endpoints
 */
const API_BASE = '/api/echoes'

/**
 * Get available locales from the backend
 */
export async function fetchLocales(): Promise<LocaleListResponse> {
  const response = await fetch(`${API_BASE}/locales`)
  if (!response.ok) {
    throw new Error(`Failed to fetch locales: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Get translations for a specific locale
 *
 * @param locale - The locale code (e.g., 'en', 'pt')
 * @param module - Optional module filter
 */
export async function fetchTranslations(
  locale: string,
  module?: string
): Promise<TranslationResponse> {
  const url = new URL(`${API_BASE}/translations/${locale}`, window.location.origin)
  if (module) {
    url.searchParams.set('module', module)
  }

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Failed to fetch translations: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Detect locale from Accept-Language header
 *
 * @param acceptLanguage - The Accept-Language header value
 */
export async function detectLocale(acceptLanguage: string): Promise<DetectLocaleResponse> {
  const response = await fetch(`${API_BASE}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accept_language: acceptLanguage })
  })
  if (!response.ok) {
    throw new Error(`Failed to detect locale: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Translate a single key via API
 *
 * @param key - Translation key
 * @param locale - Target locale (optional)
 * @param params - Interpolation parameters (optional)
 */
export async function translateKey(
  key: string,
  locale?: string,
  params?: TranslationParams
): Promise<TranslateResponse> {
  const response = await fetch(`${API_BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, locale, params })
  })
  if (!response.ok) {
    throw new Error(`Failed to translate key: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Translate multiple keys at once
 *
 * @param keys - Array of translation keys
 * @param locale - Target locale (optional)
 */
export async function translateBatch(
  keys: string[],
  locale?: string
): Promise<TranslateBatchResponse> {
  const response = await fetch(`${API_BASE}/translate/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys, locale })
  })
  if (!response.ok) {
    throw new Error(`Failed to batch translate: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Get the current locale based on request headers
 */
export async function getCurrentLocale(): Promise<string> {
  const response = await fetch(`${API_BASE}/current-locale`)
  if (!response.ok) {
    throw new Error(`Failed to get current locale: ${response.statusText}`)
  }
  const data = await response.json()
  return data.locale
}

/**
 * Check ECHOES service health
 */
export async function checkHealth(): Promise<{
  status: string
  service: string
  default_locale: string
  available_locales: number
  loaded_locales: number
}> {
  const response = await fetch(`${API_BASE}/health`)
  if (!response.ok) {
    throw new Error(`ECHOES health check failed: ${response.statusText}`)
  }
  return response.json()
}
