<script setup lang="ts">
/**
 * Echo Component
 *
 * Renders translated text with support for interpolation and pluralization.
 *
 * @example Basic usage
 * <Echo keypath="app.title" />
 *
 * @example With interpolation
 * <Echo keypath="app.welcome" :params="{ name: 'John' }" />
 *
 * @example With pluralization
 * <Echo keypath="items" :count="5" />
 *
 * @example With slot for complex content
 * <Echo keypath="app.terms">
 *   <template #link>
 *     <a href="/terms">Terms of Service</a>
 *   </template>
 * </Echo>
 */

import { computed, useSlots, h, type VNode } from 'vue'
import { useEchoes } from '../composables/useEchoes'

interface Props {
  /** Translation key (dot notation) */
  keypath: string
  /** Interpolation parameters */
  params?: Record<string, string | number | boolean>
  /** Count for pluralization */
  count?: number
  /** Fallback text if key not found */
  fallback?: string
  /** HTML tag to render (default: span) */
  tag?: string
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'span'
})

const slots = useSlots()
const { t, tc } = useEchoes({ autoInit: false })

/**
 * Get the translated text
 */
const translatedText = computed(() => {
  if (props.count !== undefined) {
    return tc(props.keypath, props.count, props.params)
  }
  return t(props.keypath, props.params, props.fallback)
})

/**
 * Check if we have named slots to interpolate
 */
const hasSlots = computed(() => {
  return Object.keys(slots).filter(name => name !== 'default').length > 0
})

/**
 * Parse the translated text and interpolate slots
 *
 * Looks for {slotName} patterns in the text and replaces them with slot content
 */
const parsedContent = computed((): (string | VNode)[] => {
  if (!hasSlots.value) {
    return [translatedText.value]
  }

  const text = translatedText.value
  const parts: (string | VNode)[] = []

  // Match {slotName} patterns
  const regex = /\{(\w+)\}/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const slotName = match[1]
    const slotContent = slots[slotName]

    if (slotContent) {
      // Render the slot
      const rendered = slotContent()
      parts.push(...rendered)
    } else {
      // Keep the placeholder if no slot provided
      parts.push(match[0])
    }

    lastIndex = regex.lastIndex
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
})
</script>

<template>
  <component :is="tag">
    <template v-if="hasSlots">
      <template v-for="(part, index) in parsedContent" :key="index">
        <template v-if="typeof part === 'string'">{{ part }}</template>
        <component v-else :is="() => part" />
      </template>
    </template>
    <template v-else>
      {{ translatedText }}
    </template>
  </component>
</template>
