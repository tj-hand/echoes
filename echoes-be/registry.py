"""
ECHOES Module Registration System

Allows other Spark modules to register their translation files with ECHOES.
Each module can provide translations organized by locale.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field


@dataclass
class ModuleTranslation:
    """Represents a module's translation configuration."""
    module_name: str
    translations_path: Optional[Path] = None
    translations: Dict[str, Dict[str, str]] = field(default_factory=dict)


class TranslationRegistry:
    """
    Central registry for module translations.

    This allows Spark modules to register their own translation files,
    which ECHOES will merge into its translation system.

    Usage:
        # In your module's initialization
        from echoes.registry import translation_registry

        # Option 1: Register translations from a directory
        translation_registry.register_module(
            "guardian",
            translations_path=Path(__file__).parent / "translations"
        )

        # Option 2: Register translations directly
        translation_registry.register_translations(
            "guardian",
            locale="en",
            translations={
                "guardian.login.title": "Sign In",
                "guardian.login.button": "Login"
            }
        )
    """

    def __init__(self):
        self._modules: Dict[str, ModuleTranslation] = {}
        self._merged_translations: Dict[str, Dict[str, str]] = {}
        self._dirty = True  # Flag to indicate if cache needs refresh

    def register_module(
        self,
        module_name: str,
        translations_path: Optional[Path] = None
    ) -> None:
        """
        Register a module with the translation system.

        Args:
            module_name: Unique identifier for the module
            translations_path: Path to directory containing {locale}.json files
        """
        if module_name in self._modules:
            # Update existing registration
            module = self._modules[module_name]
            if translations_path:
                module.translations_path = translations_path
        else:
            self._modules[module_name] = ModuleTranslation(
                module_name=module_name,
                translations_path=translations_path
            )

        # Load translations from path if provided
        if translations_path and translations_path.exists():
            self._load_module_translations(module_name)

        self._dirty = True

    def register_translations(
        self,
        module_name: str,
        locale: str,
        translations: Dict[str, str]
    ) -> None:
        """
        Register translations directly for a module.

        Args:
            module_name: The module identifier
            locale: The locale code (e.g., 'en', 'pt')
            translations: Dictionary of translation key-value pairs
        """
        if module_name not in self._modules:
            self._modules[module_name] = ModuleTranslation(module_name=module_name)

        module = self._modules[module_name]
        if locale not in module.translations:
            module.translations[locale] = {}

        module.translations[locale].update(translations)
        self._dirty = True

    def unregister_module(self, module_name: str) -> bool:
        """
        Remove a module from the registry.

        Args:
            module_name: The module to unregister

        Returns:
            True if module was found and removed, False otherwise
        """
        if module_name in self._modules:
            del self._modules[module_name]
            self._dirty = True
            return True
        return False

    def get_translations(self, locale: str) -> Dict[str, str]:
        """
        Get all merged translations for a locale.

        Args:
            locale: The locale code

        Returns:
            Dictionary of all translations for the locale
        """
        if self._dirty:
            self._rebuild_cache()

        return self._merged_translations.get(locale, {})

    def get_all_translations(self) -> Dict[str, Dict[str, str]]:
        """
        Get all translations for all locales.

        Returns:
            Dictionary mapping locale codes to translation dictionaries
        """
        if self._dirty:
            self._rebuild_cache()

        return self._merged_translations.copy()

    def get_registered_modules(self) -> List[str]:
        """Get list of all registered module names."""
        return list(self._modules.keys())

    def get_available_locales(self) -> List[str]:
        """Get list of all available locale codes."""
        if self._dirty:
            self._rebuild_cache()

        return list(self._merged_translations.keys())

    def reload_module(self, module_name: str) -> bool:
        """
        Reload translations for a specific module.

        Useful for development when translation files change.

        Args:
            module_name: The module to reload

        Returns:
            True if module was found and reloaded
        """
        if module_name not in self._modules:
            return False

        module = self._modules[module_name]
        module.translations.clear()

        if module.translations_path and module.translations_path.exists():
            self._load_module_translations(module_name)

        self._dirty = True
        return True

    def reload_all(self) -> None:
        """Reload translations for all registered modules."""
        for module_name in self._modules:
            self.reload_module(module_name)

    def _load_module_translations(self, module_name: str) -> None:
        """Load translations from a module's translations directory."""
        module = self._modules[module_name]
        if not module.translations_path:
            return

        for json_file in module.translations_path.glob("*.json"):
            locale = json_file.stem  # e.g., 'en' from 'en.json'
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    translations = json.load(f)

                # Prefix keys with module name if not already prefixed
                prefixed = {}
                for key, value in translations.items():
                    if not key.startswith(f"{module_name}."):
                        # Only prefix if it's a simple key (not already namespaced)
                        if "." not in key.split(".")[0] or key.startswith("common."):
                            prefixed[key] = value
                        else:
                            prefixed[key] = value
                    else:
                        prefixed[key] = value

                if locale not in module.translations:
                    module.translations[locale] = {}
                module.translations[locale].update(prefixed)

            except (json.JSONDecodeError, IOError) as e:
                # Log error but don't crash
                print(f"Warning: Failed to load {json_file}: {e}")

    def _rebuild_cache(self) -> None:
        """Rebuild the merged translations cache."""
        self._merged_translations.clear()

        for module in self._modules.values():
            for locale, translations in module.translations.items():
                if locale not in self._merged_translations:
                    self._merged_translations[locale] = {}
                self._merged_translations[locale].update(translations)

        self._dirty = False


# Global singleton instance
translation_registry = TranslationRegistry()


def register_module_translations(
    module_name: str,
    translations_path: Optional[Path] = None,
    translations: Optional[Dict[str, Dict[str, str]]] = None
) -> None:
    """
    Convenience function to register module translations.

    Args:
        module_name: The module identifier
        translations_path: Path to translations directory
        translations: Dict mapping locale -> translations dict
    """
    if translations_path:
        translation_registry.register_module(module_name, translations_path)

    if translations:
        for locale, trans in translations.items():
            translation_registry.register_translations(module_name, locale, trans)
