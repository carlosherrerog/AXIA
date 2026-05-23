#!/usr/bin/env bash
# Genera el ejecutable de AXIA Manufacturer Tool para Linux / macOS
set -e

echo "=== AXIA Manufacturer Tool — Build ==="

pip install -r requirements.txt --quiet

pyinstaller \
  --onefile \
  --windowed \
  --name "AXIA-Manufacturer" \
  --add-data "abi:abi" \
  --hidden-import "web3" \
  --hidden-import "web3.middleware" \
  --hidden-import "smartcard" \
  --hidden-import "PIL" \
  --clean \
  main.py

echo ""
echo "✓  Ejecutable generado en dist/AXIA-Manufacturer"
echo "   Copia también el archivo .env (configurado) junto al ejecutable."
