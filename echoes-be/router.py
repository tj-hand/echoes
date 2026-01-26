"""
ECHOES API Router

Provides REST endpoints for the translation/internationalization service.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel

from .services.echoes_service import EchoesService, get_echoes_service
from .dependencies import get_locale, get_locale_context, LocaleContext


router = APIRouter(prefix="/api/echoes", tags=["echoes", "i18n"])


# =============================================================================
# Response Models
# =============================================================================

class LocaleInfo(BaseModel):
    """Information about an available locale."""
    code: str
    name: str
    native_name: str


class LocaleListResponse(BaseModel):
    """Response for available locales endpoint."""
    locales: List[LocaleInfo]
    default: str


class TranslationResponse(BaseModel):
    """Response containing translations for a locale."""
    locale: str
    translations: Dict[str, Any]


class DetectLocaleRequest(BaseModel):
    """Request to detect locale from Accept-Language header."""
    accept_language: str


class DetectLocaleResponse(BaseModel):
    """Response with detected locale."""
    detected: str
    supported: bool


class TranslateRequest(BaseModel):
    """Request to translate a key."""
    key: str
    locale: Optional[str] = None
    params: Optional[Dict[str, Any]] = None


class TranslateResponse(BaseModel):
    """Response with translated text."""
    key: str
    locale: str
    text: str


class TranslateBatchRequest(BaseModel):
    """Request to translate multiple keys."""
    keys: List[str]
    locale: Optional[str] = None


class TranslateBatchResponse(BaseModel):
    """Response with multiple translations."""
    locale: str
    translations: Dict[str, str]


# =============================================================================
# Endpoints
# =============================================================================

@router.get("/locales", response_model=LocaleListResponse)
def get_available_locales(
    service: EchoesService = Depends(get_echoes_service)
) -> LocaleListResponse:
    """
    Get list of available locales.

    Returns all supported locales with their display names.
    """
    locales = service.get_available_locales()
    return LocaleListResponse(
        locales=[LocaleInfo(**loc) for loc in locales],
        default=service.default_locale
    )


@router.get("/translations/{locale}", response_model=TranslationResponse)
def get_translations(
    locale: str,
    module: Optional[str] = Query(None, description="Filter by module name"),
    service: EchoesService = Depends(get_echoes_service)
) -> TranslationResponse:
    """
    Get all translations for a specific locale.

    Optionally filter by module name to get only specific module translations.
    """
    # Ensure translations are loaded for this locale
    service.load_translations(locale)

    translations = service._translations.get(locale, {})

    # Filter by module if specified
    if module:
        filtered = {}
        prefix = f"{module}."
        for key, value in translations.items():
            if key.startswith(prefix):
                filtered[key] = value
        translations = filtered

    return TranslationResponse(
        locale=locale,
        translations=translations
    )


@router.post("/detect", response_model=DetectLocaleResponse)
def detect_locale(
    request: DetectLocaleRequest,
    service: EchoesService = Depends(get_echoes_service)
) -> DetectLocaleResponse:
    """
    Detect the best matching locale from an Accept-Language header.

    Returns the detected locale and whether it's a supported locale.
    """
    detected = service.detect_locale(request.accept_language)
    supported_codes = [loc["code"] for loc in service.get_available_locales()]

    return DetectLocaleResponse(
        detected=detected,
        supported=detected in supported_codes
    )


@router.post("/translate", response_model=TranslateResponse)
def translate_key(
    request: TranslateRequest,
    ctx: LocaleContext = Depends(get_locale_context),
    service: EchoesService = Depends(get_echoes_service)
) -> TranslateResponse:
    """
    Translate a single key.

    Uses the request locale from headers if locale not specified in body.
    """
    locale = request.locale or ctx.locale
    text = service.translate(request.key, locale, request.params)

    return TranslateResponse(
        key=request.key,
        locale=locale,
        text=text
    )


@router.post("/translate/batch", response_model=TranslateBatchResponse)
def translate_batch(
    request: TranslateBatchRequest,
    ctx: LocaleContext = Depends(get_locale_context),
    service: EchoesService = Depends(get_echoes_service)
) -> TranslateBatchResponse:
    """
    Translate multiple keys at once.

    Useful for fetching all translations needed for a page/component.
    """
    locale = request.locale or ctx.locale
    translations = {}

    for key in request.keys:
        translations[key] = service.translate(key, locale)

    return TranslateBatchResponse(
        locale=locale,
        translations=translations
    )


@router.get("/current-locale")
def get_current_locale(
    locale: str = Depends(get_locale)
) -> Dict[str, str]:
    """
    Get the current locale based on request headers.

    Useful for debugging and confirming locale detection.
    """
    return {"locale": locale}


@router.get("/health")
def health_check(
    service: EchoesService = Depends(get_echoes_service)
) -> Dict[str, Any]:
    """
    Health check endpoint for the ECHOES service.

    Returns service status and basic statistics.
    """
    locales = service.get_available_locales()
    return {
        "status": "healthy",
        "service": "echoes",
        "default_locale": service.default_locale,
        "available_locales": len(locales),
        "loaded_locales": len(service._translations)
    }
