#!/bin/bash
# Echoes deploy script
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${DEPLOY_TARGET:-}"
TARGET_PATH="${DEPLOY_TARGET_PATH:-}"
log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
[ -z "$TARGET" ] && { echo "Usage: DEPLOY_TARGET=infinity|matrix ./deploy.sh"; exit 1; }
case "$TARGET" in
    infinity)
        echo ""
        echo "=== Echoes FE → Infinity ==="
        log_info "Deploying echoes frontend to Infinity..."

        # Create echoes directory
        mkdir -p "${TARGET_PATH}/src/echoes"

        # Copy index.ts
        [ -f "${SCRIPT_DIR}/echoes-fe/index.ts" ] && cp "${SCRIPT_DIR}/echoes-fe/index.ts" "${TARGET_PATH}/src/echoes/"

        # Copy stores
        if [ -d "${SCRIPT_DIR}/echoes-fe/stores" ]; then
            mkdir -p "${TARGET_PATH}/src/echoes/stores"
            cp -r "${SCRIPT_DIR}/echoes-fe/stores/"* "${TARGET_PATH}/src/echoes/stores/" 2>/dev/null || true
        fi

        # Copy composables
        if [ -d "${SCRIPT_DIR}/echoes-fe/composables" ]; then
            mkdir -p "${TARGET_PATH}/src/echoes/composables"
            cp -r "${SCRIPT_DIR}/echoes-fe/composables/"* "${TARGET_PATH}/src/echoes/composables/" 2>/dev/null || true
        fi

        # Copy components (Echo.vue)
        if [ -d "${SCRIPT_DIR}/echoes-fe/components" ]; then
            mkdir -p "${TARGET_PATH}/src/echoes/components"
            cp -r "${SCRIPT_DIR}/echoes-fe/components/"* "${TARGET_PATH}/src/echoes/components/" 2>/dev/null || true
        fi

        # Copy services (API client)
        if [ -d "${SCRIPT_DIR}/echoes-fe/services" ]; then
            mkdir -p "${TARGET_PATH}/src/echoes/services"
            cp -r "${SCRIPT_DIR}/echoes-fe/services/"* "${TARGET_PATH}/src/echoes/services/" 2>/dev/null || true
        fi

        # Copy types
        if [ -d "${SCRIPT_DIR}/echoes-fe/types" ]; then
            mkdir -p "${TARGET_PATH}/src/echoes/types"
            cp -r "${SCRIPT_DIR}/echoes-fe/types/"* "${TARGET_PATH}/src/echoes/types/" 2>/dev/null || true
        fi

        echo ""
        log_success "Echoes frontend deployed to Infinity"
        ;;
    matrix)
        echo ""
        echo "=== Echoes BE → Matrix ==="
        log_info "Deploying echoes backend to Matrix..."
        mkdir -p "${TARGET_PATH}/src/modules/echoes"

        # Copy main module files
        [ -f "${SCRIPT_DIR}/echoes-be/__init__.py" ] && cp "${SCRIPT_DIR}/echoes-be/__init__.py" "${TARGET_PATH}/src/modules/echoes/"
        [ -f "${SCRIPT_DIR}/echoes-be/router.py" ] && cp "${SCRIPT_DIR}/echoes-be/router.py" "${TARGET_PATH}/src/modules/echoes/"
        [ -f "${SCRIPT_DIR}/echoes-be/dependencies.py" ] && cp "${SCRIPT_DIR}/echoes-be/dependencies.py" "${TARGET_PATH}/src/modules/echoes/"
        [ -f "${SCRIPT_DIR}/echoes-be/registry.py" ] && cp "${SCRIPT_DIR}/echoes-be/registry.py" "${TARGET_PATH}/src/modules/echoes/"

        # Copy services
        if [ -d "${SCRIPT_DIR}/echoes-be/services" ]; then
            mkdir -p "${TARGET_PATH}/src/modules/echoes/services"
            cp -r "${SCRIPT_DIR}/echoes-be/services/"* "${TARGET_PATH}/src/modules/echoes/services/" 2>/dev/null || true
        fi

        # Copy translations
        if [ -d "${SCRIPT_DIR}/echoes-be/translations" ]; then
            mkdir -p "${TARGET_PATH}/src/modules/echoes/translations"
            cp -r "${SCRIPT_DIR}/echoes-be/translations/"* "${TARGET_PATH}/src/modules/echoes/translations/" 2>/dev/null || true
        fi

        echo ""
        log_success "Echoes backend deployed to Matrix"
        ;;
esac
