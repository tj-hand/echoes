# Echoes Test Documentation

## Testing Strategy

Echoes has both frontend (TypeScript/Vue) and backend (Python/FastAPI) components. Testing includes:
- Static type checking (TypeScript, Python type hints)
- Unit tests for translation logic
- Integration tests for API endpoints
- Manual deployment validation

## Running Validation

### Frontend (TypeScript)

```bash
cd echoes-fe

# Type checking
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.vue
```

### Backend (Python)

```bash
cd echoes-be

# Type checking
mypy . --ignore-missing-imports

# Lint
ruff check .

# Tests (when available)
pytest tests/
```

### Deployment Validation

```bash
# Test via Spark
spark add echoes

# Verify files deployed
ls -la /path/to/project/src/infinity/src/echoes/
ls -la /path/to/project/src/matrix/src/modules/echoes/
```

## Validated Tests

### Backend - EchoesService

| Responsibility | Status | Validation |
|----------------|--------|------------|
| Translation lookup by key | Manual | `service.translate("common.loading", "en")` returns "Loading..." |
| Parameter interpolation | Manual | `translate("validation.min_length", "en", {"min": 3})` returns "Must be at least 3 characters" |
| Missing key returns marker | Manual | `translate("missing.key", "en")` returns "[missing.key]" |
| Locale fallback to default | Manual | Unknown locale falls back to "en" |
| Pluralization (count=0) | Manual | Returns `.zero` form |
| Pluralization (count=1) | Manual | Returns `.one` form |
| Pluralization (count>1) | Manual | Returns `.other` form |
| Accept-Language detection | Manual | `detect_locale("pt-BR,en;q=0.9")` returns "pt" |

### Backend - Registry

| Responsibility | Status | Validation |
|----------------|--------|------------|
| Module registration | Manual | `register_module_translations("guardian", path)` loads JSON files |
| Translation merging | Manual | Multiple modules' translations accessible via single lookup |
| Cache invalidation | Manual | `reload_module("guardian")` refreshes translations |

### Backend - REST API

| Endpoint | Status | Validation |
|----------|--------|------------|
| GET /api/echoes/locales | Manual | Returns list of 5 locales with codes and names |
| GET /api/echoes/translations/{locale} | Manual | Returns all translations for specified locale |
| GET /api/echoes/translations/{locale}?module=guardian | Manual | Returns only guardian.* translations |
| POST /api/echoes/detect | Manual | Returns detected locale from Accept-Language |
| POST /api/echoes/translate | Manual | Returns translated text for single key |
| POST /api/echoes/translate/batch | Manual | Returns translations for multiple keys |
| GET /api/echoes/current-locale | Manual | Returns locale from request headers |
| GET /api/echoes/health | Manual | Returns service status |

### Backend - Dependencies

| Responsibility | Status | Validation |
|----------------|--------|------------|
| get_locale extracts X-Locale header | Manual | Priority over Accept-Language |
| get_locale extracts Accept-Language | Manual | Falls back when X-Locale missing |
| get_translator returns bound function | Manual | `t("key")` translates to request locale |
| LocaleContext provides t/tc/format | Manual | All methods accessible |

### Frontend - Store

| Responsibility | Status | Validation |
|----------------|--------|------------|
| init() fetches available locales | Manual | `store.availableLocales` populated |
| init() detects browser locale | Manual | Uses navigator.languages |
| init() restores saved locale | Manual | Reads from localStorage |
| setLocale() updates state | Manual | `store.locale` changes |
| setLocale() persists to localStorage | Manual | Value saved |
| translate() returns translated text | Manual | Key lookup works |
| translatePlural() handles count | Manual | Correct plural form returned |
| Translation caching (5-min TTL) | Manual | Cache reused within TTL |

### Frontend - Composable

| Responsibility | Status | Validation |
|----------------|--------|------------|
| t(key) translates | Manual | Returns translated string |
| tc(key, count) pluralizes | Manual | Returns correct plural form |
| te(key) checks existence | Manual | Returns true/false |
| formatDate() uses Intl | Manual | Locale-aware output |
| formatNumber() uses Intl | Manual | Locale-aware output |
| formatCurrency() uses Intl | Manual | Currency symbol + formatting |
| formatPercent() uses Intl | Manual | Percentage formatting |
| formatList() uses Intl | Manual | Conjunction/disjunction formatting |
| formatRelativeTime() | Manual | "2 days ago" style output |

### Frontend - Echo Component

| Responsibility | Status | Validation |
|----------------|--------|------------|
| Basic translation | Manual | `<Echo keypath="common.loading" />` renders "Loading..." |
| Parameter interpolation | Manual | `:params="{ name: 'John' }"` interpolates |
| Pluralization | Manual | `:count="5"` selects plural form |
| Slot interpolation | Manual | Named slots replace `{slotName}` |

### Translation Files

| Check | Files | Status |
|-------|-------|--------|
| en.json valid JSON | 1 | Validated |
| pt.json valid JSON | 1 | Validated |
| es.json valid JSON | 1 | Validated |
| All keys present in en | 1 | Validated |
| Key parity across locales | 3 | Validated |

## Pending Tests (Blocked By)

| Test | Blocked By |
|------|------------|
| Backend unit tests | pytest setup in module |
| Frontend unit tests | vitest setup in module |
| E2E API tests | Test project with running Matrix |
| Visual component tests | Stage integration |

## Known Gaps

| Gap | Severity | Reason |
|-----|----------|--------|
| Automated unit tests | Medium | Need test infrastructure setup |
| Translation key coverage | Low | Modules add their own translations |
| Babel formatting tests | Low | Optional dependency, has fallback |
| Concurrent locale loading | Low | Edge case, caching handles |

## Integration Testing

Echoes is tested indirectly through:

1. **Spark deployment** - `spark add echoes` validates file structure and hooks
2. **Infinity build** - Vite/TypeScript validates frontend syntax
3. **Matrix startup** - FastAPI validates backend syntax and imports
4. **Stage components** - UI components validate translation rendering

## Adding Tests

When implementing automated tests:

### Backend (pytest)

```python
# tests/test_echoes_service.py
from echoes.services.echoes_service import EchoesService

def test_translate_returns_value():
    service = EchoesService()
    result = service.translate("common.loading", "en")
    assert result == "Loading..."

def test_translate_missing_returns_marker():
    service = EchoesService()
    result = service.translate("missing.key", "en")
    assert result == "[missing.key]"
```

### Frontend (vitest)

```typescript
// tests/useEchoes.test.ts
import { describe, it, expect } from 'vitest'
import { useEchoes } from '../composables/useEchoes'

describe('useEchoes', () => {
  it('t() returns translated text', () => {
    const { t } = useEchoes()
    expect(t('common.loading')).toBe('Loading...')
  })
})
```
