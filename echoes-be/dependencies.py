"""
ECHOES FastAPI Dependencies

Provides dependency injection for the ECHOES translation service.
"""

from typing import Optional, Callable
from fastapi import Depends, Header

from .services.echoes_service import EchoesService, get_echoes_service


def get_locale(
    accept_language: Optional[str] = Header(None, alias="Accept-Language"),
    x_locale: Optional[str] = Header(None, alias="X-Locale")
) -> str:
    """
    Extract locale from request headers.

    Priority:
    1. X-Locale header (explicit user preference)
    2. Accept-Language header (browser preference)
    3. Default locale ('en')

    Args:
        accept_language: Accept-Language header value
        x_locale: X-Locale header value (explicit override)

    Returns:
        Locale code (e.g., 'en', 'pt', 'es')
    """
    # X-Locale takes priority (explicit user preference)
    if x_locale:
        # Normalize to base locale
        return x_locale.split("-")[0].lower()

    if accept_language:
        # Parse Accept-Language header
        # Example: "en-US,en;q=0.9,pt;q=0.8"
        locales = accept_language.split(",")
        if locales:
            primary = locales[0].split(";")[0].strip()
            return primary.split("-")[0].lower()

    return "en"


def get_translator(
    locale: str = Depends(get_locale),
    service: EchoesService = Depends(get_echoes_service)
) -> Callable[[str, Optional[dict]], str]:
    """
    Get a translator function pre-configured with the request locale.

    Usage in route:
        @router.get("/example")
        def example(t: Callable = Depends(get_translator)):
            return {"message": t("guardian.login.title")}

    Args:
        locale: The request locale (from get_locale)
        service: The EchoesService instance

    Returns:
        A translate function bound to the request locale
    """
    def translate(key: str, params: Optional[dict] = None) -> str:
        return service.translate(key, locale, params)

    return translate


class LocaleContext:
    """
    Context object providing locale information and translation functions.

    Useful when you need access to multiple translation features.
    """

    def __init__(self, locale: str, service: EchoesService):
        self.locale = locale
        self._service = service

    def t(self, key: str, params: Optional[dict] = None) -> str:
        """Translate a key."""
        return self._service.translate(key, self.locale, params)

    def tc(self, key: str, count: int, params: Optional[dict] = None) -> str:
        """Translate with pluralization."""
        return self._service.translate_plural(key, count, self.locale, params)

    def format_date(self, value, format: str = "medium") -> str:
        """Format a date."""
        return self._service.format_date(value, self.locale, format)

    def format_number(self, value, decimal_places: Optional[int] = None) -> str:
        """Format a number."""
        return self._service.format_number(value, self.locale, decimal_places)

    def format_currency(self, value, currency: str = "USD") -> str:
        """Format a currency value."""
        return self._service.format_currency(value, self.locale, currency)


def get_locale_context(
    locale: str = Depends(get_locale),
    service: EchoesService = Depends(get_echoes_service)
) -> LocaleContext:
    """
    Get a LocaleContext object with the request locale.

    Usage in route:
        @router.get("/example")
        def example(ctx: LocaleContext = Depends(get_locale_context)):
            title = ctx.t("guardian.login.title")
            date = ctx.format_date(datetime.now())
            return {"title": title, "date": date}

    Args:
        locale: The request locale (from get_locale)
        service: The EchoesService instance

    Returns:
        LocaleContext bound to the request locale
    """
    return LocaleContext(locale, service)
