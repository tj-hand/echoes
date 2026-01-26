"""
ECHOES - Backend Translation & Internationalization Service

Provides i18n/l10n capabilities for the Spark Framework.

Quick Start:
    from echoes import EchoesService, get_echoes_service

    # In FastAPI routes
    from echoes import get_translator, get_locale_context

    @router.get("/example")
    def example(t = Depends(get_translator)):
        return {"message": t("common.welcome")}

Module Registration:
    from echoes import register_module_translations
    from pathlib import Path

    register_module_translations(
        "guardian",
        translations_path=Path(__file__).parent / "translations"
    )
"""

from .services.echoes_service import EchoesService, get_echoes_service
from .dependencies import (
    get_locale,
    get_translator,
    get_locale_context,
    LocaleContext,
)
from .registry import (
    TranslationRegistry,
    translation_registry,
    register_module_translations,
)
from .router import router

__version__ = "1.0.0"

__all__ = [
    # Core service
    "EchoesService",
    "get_echoes_service",
    # FastAPI dependencies
    "get_locale",
    "get_translator",
    "get_locale_context",
    "LocaleContext",
    # Module registration
    "TranslationRegistry",
    "translation_registry",
    "register_module_translations",
    # Router
    "router",
]
