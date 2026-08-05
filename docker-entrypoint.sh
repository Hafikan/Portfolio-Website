#!/bin/sh
# Seed the data volume on first boot.
#
# A named volume mounted over /app/src/data starts out empty (Docker only
# pre-populates it from the image on the very first `up`, and a bind mount never
# gets populated at all). Without this the admin registries would read as empty
# arrays and the site would render blank.
#
# Only *missing* files are copied, so this is safe to run on every start and
# never clobbers content the admin panel has written.
set -eu

SEED_DIR=/app/seed/data
DATA_DIR=/app/src/data

if [ -d "$SEED_DIR" ]; then
    for seed in "$SEED_DIR"/*.json; do
        [ -e "$seed" ] || continue
        target="$DATA_DIR/$(basename "$seed")"
        if [ ! -f "$target" ]; then
            if cp "$seed" "$target" 2>/dev/null; then
                echo "entrypoint: seeded $(basename "$seed")"
            else
                echo "entrypoint: WARNING could not seed $(basename "$seed") — is $DATA_DIR writable by uid $(id -u)?" >&2
            fi
        fi
    done
fi

# Fail loudly at boot instead of silently accepting 'default_secret' as the HMAC
# key for admin sessions (src/lib/auth.ts falls back to it when unset).
if [ -z "${ADMIN_PASSWORD:-}" ]; then
    echo "entrypoint: FATAL ADMIN_PASSWORD is not set — refusing to start with the default session secret." >&2
    exit 1
fi

exec "$@"
