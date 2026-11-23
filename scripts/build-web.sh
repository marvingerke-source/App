#!/usr/bin/env bash
# Erzeugt web/index.html (eigenständig im Browser lauffähig, speichert lokal)
# aus src/keto-kueche.html (Quelle der geteilten claude.ai-Version).
set -euo pipefail
cd "$(dirname "$0")/.."
{
  printf '<!doctype html>\n<html lang="de"><head><meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  printf '<meta name="apple-mobile-web-app-capable" content="yes">\n'
  printf '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>\n'
  printf '</head><body>\n'
  cat src/keto-kueche.html
  printf '\n</body></html>\n'
} > web/index.html
echo "web/index.html erzeugt"
