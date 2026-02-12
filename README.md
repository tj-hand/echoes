# Echoes

Internationalization (i18n) and localization (l10n) system for the Spark Stack.

Part of L3 Foundation: `Vibes → Echoes → Stage`. Deploys to Infinity (FE) and Matrix (BE).

## What It Does

| Responsibility | Description |
|----------------|-------------|
| **Translation lookup** | Key-value translation with dot notation (`guardian.login.title`) |
| **Parameter interpolation** | Template strings with `{param}` placeholders |
| **Pluralization** | CLDR plural rules (zero/one/two/few/many/other) |
| **Locale detection** | From `Accept-Language` or `X-Locale` headers (BE), browser preferences (FE) |
| **Formatting** | Locale-aware date, number, currency, percentage formatting |
| **Module registration** | Other modules can register their own translation files |

## Provides

### Backend (Matrix)

| Export | Description |
|--------|-------------|
| `get_translator` | FastAPI dependency → `t(key, params)` function bound to request locale |
| `get_locale_context` | FastAPI dependency → `LocaleContext` with t/tc/format methods |
| `register_module_translations(name, path)` | Register module translation files |
| `router` | REST API at `/api/echoes/*` |

### Frontend (Infinity)

| Export | Description |
|--------|-------------|
| `useEchoes()` | Composable: t/tc/te + formatDate/Number/Currency/Percent/List |
| `useEchoesStore()` | Pinia store for locale state and translation cache |
| `<Echo>` | Vue component for inline translations with slot interpolation |
| API functions | `fetchLocales`, `fetchTranslations`, `translateKey`, `translateBatch` |

### Translations Included

| Namespace | Keys |
|-----------|------|
| `common.*` | Buttons: loading, error, success, cancel, confirm, save, delete, edit, etc. |
| `validation.*` | Form validation: required, email, min_length, max_length |
| `errors.*` | Error messages: generic, network, unauthorized, not_found, server |
| `time.*` | Relative time: just_now, minutes_ago, hours_ago, days_ago |
| `pagination.*` | Pagination: showing, items_per_page, page |
| `accessibility.*` | A11y labels: skip_to_content, loading_content, close_modal |
| `{module}.actions.*` | Action labels for guardian/mentor/reel/aurora permission UI |

## Expects

| From | What |
|------|------|
| Matrix | Deployment slot at `src/modules/echoes/` |
| Infinity | Deployment slot at `src/echoes/` |
| Infinity | Pinia installed |
| Infinity | Path alias `@/echoes` → `src/echoes/` in Vite config |
| API requests | `Accept-Language` or `X-Locale` header for locale detection |
| Modules | Translation files in `translations/` directory with `{locale}.json` naming |

## Never Does

| Boundary | Owner |
|----------|-------|
| User authentication | Guardian |
| Server-side locale persistence | Application |
| Translation editing UI | Application |
| Build-time translation validation | Application build |

## Structure

```
echoes/
├── deploy.sh                    # Deploy to Infinity + Matrix
├── echoes-fe/
│   ├── index.ts                 # Module exports
│   ├── stores/echoes.ts         # Pinia store (locale, cache, translate)
│   ├── composables/useEchoes.ts # Main composable (t, tc, format*)
│   ├── components/Echo.vue      # Translation component
│   ├── services/echoes-api.ts   # HTTP client
│   └── types/index.ts           # TypeScript interfaces
└── echoes-be/
    ├── __init__.py              # Module exports
    ├── router.py                # REST API endpoints
    ├── registry.py              # Module translation registration
    ├── dependencies.py          # FastAPI dependencies
    ├── services/echoes_service.py # Core translation service
    └── translations/
        ├── en.json              # English
        ├── pt.json              # Portuguese
        └── es.json              # Spanish
```

## Usage

```bash
# Via Spark
spark add echoes

# Manual deployment
DEPLOY_TARGET=infinity DEPLOY_TARGET_PATH=/path/to/infinity ./deploy.sh
DEPLOY_TARGET=matrix DEPLOY_TARGET_PATH=/path/to/matrix ./deploy.sh
```

### Backend Usage

```python
from echoes import get_translator, get_locale_context

@router.get("/example")
def example(t = Depends(get_translator)):
    return {"message": t("common.welcome")}

@router.get("/formatted")
def formatted(ctx: LocaleContext = Depends(get_locale_context)):
    return {
        "greeting": ctx.t("app.hello", {"name": "John"}),
        "items": ctx.tc("items", 5),
        "date": ctx.format_date(datetime.now())
    }
```

### Frontend Usage

```vue
<script setup>
import { useEchoes } from '@/echoes'

const { t, tc, formatDate, formatCurrency, setLocale } = useEchoes()
</script>

<template>
  <h1>{{ t('app.title') }}</h1>
  <p>{{ t('app.welcome', { name: userName }) }}</p>
  <p>{{ tc('items', itemCount) }}</p>
  <p>{{ formatDate(createdAt) }}</p>
  <p>{{ formatCurrency(price, 'USD') }}</p>
  <button @click="setLocale('pt')">Português</button>
</template>
```

### Echo Component

```vue
<template>
  <!-- Basic -->
  <Echo keypath="app.title" />

  <!-- With interpolation -->
  <Echo keypath="app.welcome" :params="{ name: 'John' }" />

  <!-- With pluralization -->
  <Echo keypath="items" :count="5" />

  <!-- With slot for complex content -->
  <Echo keypath="app.terms">
    <template #link>
      <a href="/terms">Terms of Service</a>
    </template>
  </Echo>
</template>
```

### Registering Module Translations

```python
# In your module's startup
from echoes import register_module_translations
from pathlib import Path

register_module_translations(
    "guardian",
    translations_path=Path(__file__).parent / "translations"
)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/echoes/locales` | List available locales |
| GET | `/api/echoes/translations/{locale}` | Get all translations for locale |
| POST | `/api/echoes/detect` | Detect locale from Accept-Language |
| POST | `/api/echoes/translate` | Translate single key |
| POST | `/api/echoes/translate/batch` | Translate multiple keys |
| GET | `/api/echoes/current-locale` | Get request's detected locale |
| GET | `/api/echoes/health` | Health check |

## Supported Locales

| Code | Name | Native |
|------|------|--------|
| en | English | English |
| pt | Portuguese | Português |
| es | Spanish | Español |
| fr | French | Français |
| de | German | Deutsch |

## Reference

Full spec: [architecture.md](https://github.com/tj-hand/spark/blob/main/architecture.md)
