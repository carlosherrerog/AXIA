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
  --add-data "icons:icons" \
  --hidden-import "web3" \
  --hidden-import "web3.middleware" \
  --hidden-import "web3.providers" \
  --hidden-import "smartcard" \
  --hidden-import "smartcard.System" \
  --hidden-import "smartcard.util" \
  --hidden-import "PIL" \
  --hidden-import "PIL.Image" \
  --hidden-import "PIL.ImageTk" \
  --clean \
  main.py

echo ""
echo "✓  Ejecutable generado en dist/AXIA-Manufacturer"
echo "   Copia también el archivo .env (configurado) junto al ejecutable."
