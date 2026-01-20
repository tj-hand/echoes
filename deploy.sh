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
        log_info "Deploying echoes frontend to Infinity..."
        [ -d "${SCRIPT_DIR}/echoes-fe/stores" ] && { mkdir -p "${TARGET_PATH}/src/stores/echoes"; cp -r "${SCRIPT_DIR}/echoes-fe/stores/"* "${TARGET_PATH}/src/stores/echoes/" 2>/dev/null || true; }
        [ -d "${SCRIPT_DIR}/echoes-fe/composables" ] && { mkdir -p "${TARGET_PATH}/src/composables/echoes"; cp -r "${SCRIPT_DIR}/echoes-fe/composables/"* "${TARGET_PATH}/src/composables/echoes/" 2>/dev/null || true; }
        log_success "Echoes frontend deployed to Infinity"
        ;;
    matrix)
        log_info "Deploying echoes backend to Matrix..."
        mkdir -p "${TARGET_PATH}/src/modules/echoes"
        [ -d "${SCRIPT_DIR}/echoes-be/services" ] && { mkdir -p "${TARGET_PATH}/src/modules/echoes/services"; cp -r "${SCRIPT_DIR}/echoes-be/services/"* "${TARGET_PATH}/src/modules/echoes/services/" 2>/dev/null || true; }
        [ -d "${SCRIPT_DIR}/echoes-be/routers" ] && { mkdir -p "${TARGET_PATH}/src/modules/echoes/routers"; cp -r "${SCRIPT_DIR}/echoes-be/routers/"* "${TARGET_PATH}/src/modules/echoes/routers/" 2>/dev/null || true; }
        log_success "Echoes backend deployed to Matrix"
        ;;
esac
