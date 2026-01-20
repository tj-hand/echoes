# Echoes

i18n/Localization module for Spark stack.

## Overview

Echoes provides internationalization (i18n) and localization support for both frontend and backend components.

## Structure

```
echoes/
├── echoes-fe/          # Frontend components
│   ├── stores/         # Pinia stores for i18n state
│   └── composables/    # Vue composables for i18n
└── echoes-be/          # Backend components
    ├── services/       # Translation services
    └── routers/        # API endpoints
```

## Installation

This module is deployed via Spark:

```bash
./spark deploy echoes
```

## Dependencies

- No strict dependencies
