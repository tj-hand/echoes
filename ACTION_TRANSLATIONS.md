# Action Translation Infrastructure

This document describes the translation key conventions for MENTOR actions across all Spark modules.

## Overview

Every action registered with MENTOR should have corresponding translation keys in ECHOES. This enables:
- Displaying action names in the user's preferred language
- Providing localized descriptions for permission management UI
- Consistent terminology across the application

## Key Convention

Actions follow this translation key pattern:

```
{module}.actions.{resource}.{operation}.name
{module}.actions.{resource}.{operation}.description
```

### Components

| Component | Description | Example |
|-----------|-------------|---------|
| `{module}` | The module name (lowercase) | `guardian`, `mentor`, `reel`, `aurora` |
| `{resource}` | The resource type being acted upon | `users`, `clients`, `logs`, `invitations` |
| `{operation}` | The operation being performed | `view`, `create`, `edit`, `delete`, `export` |

### Examples

```json
{
  "guardian.actions.users.view.name": "View Users",
  "guardian.actions.users.view.description": "View user list and basic information",

  "mentor.actions.clients.create.name": "Create Clients",
  "mentor.actions.clients.create.description": "Create new clients within a tenant",

  "reel.actions.logs.export.name": "Export Logs",
  "reel.actions.logs.export.description": "Export logs to external formats"
}
```

## Registered Actions by Module

### Guardian

| Action Code | Name Key | Description Key |
|------------|----------|-----------------|
| `guardian.users.view` | `guardian.actions.users.view.name` | `guardian.actions.users.view.description` |
| `guardian.users.detail` | `guardian.actions.users.detail.name` | `guardian.actions.users.detail.description` |

### Mentor

| Action Code | Name Key | Description Key |
|------------|----------|-----------------|
| `mentor.accounts.view` | `mentor.actions.accounts.view.name` | `mentor.actions.accounts.view.description` |
| `mentor.accounts.edit` | `mentor.actions.accounts.edit.name` | `mentor.actions.accounts.edit.description` |
| `mentor.clients.view` | `mentor.actions.clients.view.name` | `mentor.actions.clients.view.description` |
| `mentor.clients.create` | `mentor.actions.clients.create.name` | `mentor.actions.clients.create.description` |
| `mentor.clients.edit` | `mentor.actions.clients.edit.name` | `mentor.actions.clients.edit.description` |
| `mentor.users.view` | `mentor.actions.users.view.name` | `mentor.actions.users.view.description` |
| `mentor.users.assign` | `mentor.actions.users.assign.name` | `mentor.actions.users.assign.description` |
| `mentor.users.permissions` | `mentor.actions.users.permissions.name` | `mentor.actions.users.permissions.description` |
| `mentor.collections.view` | `mentor.actions.collections.view.name` | `mentor.actions.collections.view.description` |
| `mentor.collections.manage` | `mentor.actions.collections.manage.name` | `mentor.actions.collections.manage.description` |

### Reel

| Action Code | Name Key | Description Key |
|------------|----------|-----------------|
| `reel.logs.view` | `reel.actions.logs.view.name` | `reel.actions.logs.view.description` |
| `reel.logs.export` | `reel.actions.logs.export.name` | `reel.actions.logs.export.description` |
| `reel.logs.filter` | `reel.actions.logs.filter.name` | `reel.actions.logs.filter.description` |

### Aurora

| Action Code | Name Key | Description Key |
|------------|----------|-----------------|
| `aurora.invitations.view` | `aurora.actions.invitations.view.name` | `aurora.actions.invitations.view.description` |
| `aurora.invitations.create` | `aurora.actions.invitations.create.name` | `aurora.actions.invitations.create.description` |
| `aurora.invitations.revoke` | `aurora.actions.invitations.revoke.name` | `aurora.actions.invitations.revoke.description` |

## Adding New Actions

When adding a new action to a module:

### 1. Register the Action with MENTOR

```python
# In your module's startup/registration code
from mentor.registry import ActionRegistry

registry = ActionRegistry()
registry.register_action(
    code="mymodule.resource.operation",
    name_key="mymodule.actions.resource.operation.name",
    description_key="mymodule.actions.resource.operation.description",
    valid_scopes=["ACCOUNT", "CLIENT"]
)
```

### 2. Add Translation Keys

Add entries to each locale file in `modules/echoes/echoes-be/translations/`:

**en.json:**
```json
{
  "mymodule.actions.resource.operation.name": "Operation Resource",
  "mymodule.actions.resource.operation.description": "Description of what this action allows"
}
```

**pt.json:**
```json
{
  "mymodule.actions.resource.operation.name": "Operação de Recurso",
  "mymodule.actions.resource.operation.description": "Descrição do que esta ação permite"
}
```

**es.json:**
```json
{
  "mymodule.actions.resource.operation.name": "Operación de Recurso",
  "mymodule.actions.resource.operation.description": "Descripción de lo que permite esta acción"
}
```

### 3. Use in Frontend

```vue
<script setup>
import { useEchoes } from '@/echoes'

const { t } = useEchoes()

// Get action name
const actionName = t('mymodule.actions.resource.operation.name')

// Get action description
const actionDesc = t('mymodule.actions.resource.operation.description')
</script>
```

## Best Practices

1. **Keep names concise**: Action names should be 2-4 words maximum
2. **Descriptions explain the permission**: Describe what having this permission allows
3. **Use consistent verbs**: `View`, `Create`, `Edit`, `Delete`, `Manage`, `Export`
4. **Follow existing patterns**: Look at existing actions in the same module for consistency
5. **Always provide all locales**: Every action needs translations for all supported locales

## Fallback Behavior

If a translation key is not found:
- ECHOES returns `[key.path]` as a marker (e.g., `[mymodule.actions.resource.operation.name]`)
- This makes missing translations obvious in the UI
- Check the browser console for warnings about missing translations
