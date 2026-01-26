"""
ECHOES Service - Backend Translation Service

Provides translation and internationalization services for the Spark Framework.
"""

from typing import Optional, Dict, Any, List
from pathlib import Path
from datetime import datetime, date
import json
import re
from functools import lru_cache

try:
    from babel import Locale, numbers, dates
    from babel.support import Translations
    BABEL_AVAILABLE = True
except ImportError:
    BABEL_AVAILABLE = False


class EchoesService:
    """
    Translation service for the Spark Framework.

    Provides:
    - Translation of keys to localized strings
    - Pluralization support
    - Date/time/number formatting
    - Module translation registration
    """

    def __init__(self, default_locale: str = "en"):
        """
        Initialize the EchoesService.

        Args:
            default_locale: The default fallback locale (default: 'en')
        """
        self._default_locale = default_locale
        self._translations: Dict[str, Dict[str, Any]] = {}
        self._loaded_locales: set = set()
        self._registered_modules: set = set()
        self._modules_path: Optional[Path] = None

    @property
    def default_locale(self) -> str:
        """Get the default locale."""
        return self._default_locale

    @default_locale.setter
    def default_locale(self, value: str) -> None:
        """Set the default locale."""
        self._default_locale = value

    def set_modules_path(self, path: Path) -> None:
        """
        Set the base path for module directories.

        Args:
            path: Path to the modules directory
        """
        self._modules_path = path

    def load_translations(self, locale: str) -> None:
        """
        Load translations for a specific locale from all registered modules.

        Args:
            locale: Locale code (e.g., 'en', 'pt', 'es')
        """
        if locale in self._loaded_locales:
            return

        self._translations[locale] = {}

        if self._modules_path is None:
            # Default to looking for locales relative to this file
            self._modules_path = Path(__file__).parent.parent.parent

        # Load translations from each registered module
        for module_dir in self._modules_path.iterdir():
            if not module_dir.is_dir():
                continue

            # Look for backend locales
            be_locales_path = module_dir / f"{module_dir.name}-be" / "locales" / f"{locale}.json"
            if be_locales_path.exists():
                self._load_translation_file(locale, be_locales_path)

            # Also check direct locales folder
            locales_path = module_dir / "locales" / f"{locale}.json"
            if locales_path.exists():
                self._load_translation_file(locale, locales_path)

        self._loaded_locales.add(locale)

    def _load_translation_file(self, locale: str, file_path: Path) -> None:
        """
        Load a single translation file.

        Args:
            locale: The locale being loaded
            file_path: Path to the JSON translation file
        """
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                module_translations = json.load(f)
                if locale not in self._translations:
                    self._translations[locale] = {}
                self._translations[locale].update(module_translations)
        except (json.JSONDecodeError, IOError) as e:
            # Log error but don't fail - translations may be partial
            print(f"Warning: Failed to load translations from {file_path}: {e}")

    def register_module_translations(
        self,
        module_name: str,
        translations: Dict[str, Dict[str, Any]]
    ) -> None:
        """
        Register translations for a module dynamically.

        Args:
            module_name: Name of the module
            translations: Dict mapping locale codes to translation dicts
                         e.g., {'en': {'guardian': {...}}, 'pt': {'guardian': {...}}}
        """
        self._registered_modules.add(module_name)

        for locale, locale_translations in translations.items():
            if locale not in self._translations:
                self._translations[locale] = {}
            self._translations[locale].update(locale_translations)
            self._loaded_locales.add(locale)

    def translate(
        self,
        key: str,
        locale: str = None,
        params: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Translate a key to the specified locale.

        Args:
            key: Translation key using dot notation (e.g., 'guardian.login.title')
            locale: Target locale (defaults to default_locale)
            params: Interpolation parameters (e.g., {'name': 'John'})

        Returns:
            Translated string, or key marker if not found
        """
        if locale is None:
            locale = self._default_locale

        # Ensure translations are loaded
        self.load_translations(locale)
        self.load_translations(self._default_locale)

        # Try locale first, then fallback to default
        value = self._get_nested_value(self._translations.get(locale, {}), key)
        if value is None:
            value = self._get_nested_value(
                self._translations.get(self._default_locale, {}),
                key
            )

        if value is None:
            return f"[{key}]"  # Missing translation marker

        # Interpolate parameters
        if params:
            value = self._interpolate(value, params)

        return value

    def translate_plural(
        self,
        key: str,
        count: int,
        locale: str = None,
        params: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Translate with pluralization.

        Expected key structure in translation files:
        - {key}.zero (optional)
        - {key}.one
        - {key}.other (or {key}.many for some locales)

        Args:
            key: Base translation key
            count: Count for pluralization
            locale: Target locale
            params: Additional interpolation parameters

        Returns:
            Pluralized translated string
        """
        if locale is None:
            locale = self._default_locale

        plural_form = self._get_plural_form(count, locale)
        plural_key = f"{key}.{plural_form}"

        all_params = {"count": count, **(params or {})}

        result = self.translate(plural_key, locale, all_params)

        # Fallback to 'other' if specific form not found
        if result.startswith("[") and plural_form != "other":
            result = self.translate(f"{key}.other", locale, all_params)

        return result

    def has_translation(self, key: str, locale: str = None) -> bool:
        """
        Check if a translation exists for the given key.

        Args:
            key: Translation key
            locale: Locale to check (defaults to default_locale)

        Returns:
            True if translation exists, False otherwise
        """
        if locale is None:
            locale = self._default_locale

        self.load_translations(locale)
        return self._get_nested_value(self._translations.get(locale, {}), key) is not None

    def _get_plural_form(self, count: int, locale: str) -> str:
        """
        Get the plural form based on count and locale.

        Uses simplified CLDR plural rules.

        Args:
            count: The count value
            locale: The locale code

        Returns:
            Plural form: 'zero', 'one', 'two', 'few', 'many', or 'other'
        """
        base_locale = locale.split("-")[0] if "-" in locale else locale

        if count == 0:
            return "zero"

        # French: 0 and 1 are singular
        if base_locale == "fr":
            return "one" if count in (0, 1) else "other"

        # Russian: complex rules
        if base_locale == "ru":
            mod10 = count % 10
            mod100 = count % 100
            if mod10 == 1 and mod100 != 11:
                return "one"
            if 2 <= mod10 <= 4 and not (12 <= mod100 <= 14):
                return "few"
            return "many"

        # Arabic: most complex
        if base_locale == "ar":
            if count == 0:
                return "zero"
            if count == 1:
                return "one"
            if count == 2:
                return "two"
            mod100 = count % 100
            if 3 <= mod100 <= 10:
                return "few"
            if 11 <= mod100:
                return "many"
            return "other"

        # Default (English, Portuguese, Spanish, German, Italian, etc.)
        return "one" if count == 1 else "other"

    def _get_nested_value(self, data: Dict, key: str) -> Optional[str]:
        """
        Get a nested value from a dict using dot notation.

        Args:
            data: The dictionary to search
            key: Dot-notated key (e.g., 'guardian.login.title')

        Returns:
            The value if found, None otherwise
        """
        keys = key.split(".")
        value = data

        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return None

        return value if isinstance(value, str) else None

    def _interpolate(self, template: str, params: Dict[str, Any]) -> str:
        """
        Interpolate parameters into a template string.

        Uses {param_name} syntax.

        Args:
            template: Template string with placeholders
            params: Parameters to interpolate

        Returns:
            Interpolated string
        """
        def replace_param(match):
            param_name = match.group(1)
            value = params.get(param_name)
            return str(value) if value is not None else match.group(0)

        return re.sub(r"\{(\w+)\}", replace_param, template)

    def format_date(
        self,
        value: datetime | date | str,
        locale: str = None,
        format: str = "medium"
    ) -> str:
        """
        Format a date according to locale conventions.

        Args:
            value: Date to format (datetime, date, or ISO string)
            locale: Target locale
            format: Format style ('short', 'medium', 'long', 'full')

        Returns:
            Formatted date string
        """
        if locale is None:
            locale = self._default_locale

        if isinstance(value, str):
            value = datetime.fromisoformat(value)

        if not BABEL_AVAILABLE:
            # Fallback without babel
            return value.strftime("%Y-%m-%d")

        babel_locale = Locale.parse(locale.replace("-", "_"))
        return dates.format_date(value, format=format, locale=babel_locale)

    def format_datetime(
        self,
        value: datetime | str,
        locale: str = None,
        format: str = "medium"
    ) -> str:
        """
        Format a datetime according to locale conventions.

        Args:
            value: Datetime to format
            locale: Target locale
            format: Format style ('short', 'medium', 'long', 'full')

        Returns:
            Formatted datetime string
        """
        if locale is None:
            locale = self._default_locale

        if isinstance(value, str):
            value = datetime.fromisoformat(value)

        if not BABEL_AVAILABLE:
            return value.strftime("%Y-%m-%d %H:%M:%S")

        babel_locale = Locale.parse(locale.replace("-", "_"))
        return dates.format_datetime(value, format=format, locale=babel_locale)

    def format_number(
        self,
        value: float | int,
        locale: str = None,
        decimal_places: Optional[int] = None
    ) -> str:
        """
        Format a number according to locale conventions.

        Args:
            value: Number to format
            locale: Target locale
            decimal_places: Number of decimal places (optional)

        Returns:
            Formatted number string
        """
        if locale is None:
            locale = self._default_locale

        if not BABEL_AVAILABLE:
            if decimal_places is not None:
                return f"{value:,.{decimal_places}f}"
            return f"{value:,}"

        babel_locale = Locale.parse(locale.replace("-", "_"))

        if decimal_places is not None:
            format_str = f"#,##0.{'0' * decimal_places}"
            return numbers.format_decimal(value, format=format_str, locale=babel_locale)

        return numbers.format_decimal(value, locale=babel_locale)

    def format_currency(
        self,
        value: float | int,
        locale: str = None,
        currency: str = "USD"
    ) -> str:
        """
        Format a currency value according to locale conventions.

        Args:
            value: Amount to format
            locale: Target locale
            currency: Currency code (e.g., 'USD', 'EUR', 'BRL')

        Returns:
            Formatted currency string
        """
        if locale is None:
            locale = self._default_locale

        if not BABEL_AVAILABLE:
            return f"{currency} {value:,.2f}"

        babel_locale = Locale.parse(locale.replace("-", "_"))
        return numbers.format_currency(value, currency, locale=babel_locale)

    def format_percent(
        self,
        value: float,
        locale: str = None,
        decimal_places: int = 0
    ) -> str:
        """
        Format a percentage according to locale conventions.

        Args:
            value: Decimal value (0.5 = 50%)
            locale: Target locale
            decimal_places: Number of decimal places

        Returns:
            Formatted percentage string
        """
        if locale is None:
            locale = self._default_locale

        if not BABEL_AVAILABLE:
            return f"{value * 100:.{decimal_places}f}%"

        babel_locale = Locale.parse(locale.replace("-", "_"))
        return numbers.format_percent(value, locale=babel_locale)

    def get_available_locales(self) -> List[Dict[str, str]]:
        """
        Get list of available locales.

        Returns:
            List of locale dicts with 'code', 'name', 'nativeName'
        """
        return [
            {"code": "en", "name": "English", "nativeName": "English"},
            {"code": "pt", "name": "Portuguese", "nativeName": "Português"},
            {"code": "es", "name": "Spanish", "nativeName": "Español"},
            {"code": "fr", "name": "French", "nativeName": "Français"},
            {"code": "de", "name": "German", "nativeName": "Deutsch"},
        ]

    def detect_locale(self, accept_language: Optional[str]) -> str:
        """
        Detect the best locale from an Accept-Language header.

        Args:
            accept_language: The Accept-Language header value

        Returns:
            Best matching locale code
        """
        available = [loc["code"] for loc in self.get_available_locales()]

        if not accept_language:
            return self._default_locale

        # Parse Accept-Language header
        for lang in accept_language.split(","):
            code = lang.split(";")[0].strip().split("-")[0]
            if code in available:
                return code

        return self._default_locale

    def get_loaded_locales(self) -> List[str]:
        """Get list of currently loaded locales."""
        return list(self._loaded_locales)

    def get_registered_modules(self) -> List[str]:
        """Get list of registered modules."""
        return list(self._registered_modules)

    def clear_cache(self) -> None:
        """Clear all cached translations."""
        self._translations.clear()
        self._loaded_locales.clear()


# Singleton instance
_echoes_service: Optional[EchoesService] = None


def get_echoes_service() -> EchoesService:
    """
    Get the singleton EchoesService instance.

    Returns:
        The EchoesService singleton
    """
    global _echoes_service
    if _echoes_service is None:
        _echoes_service = EchoesService()
    return _echoes_service
