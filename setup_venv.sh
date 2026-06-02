#!/bin/bash
# Requires Python 3.9–3.11 (usd-core 26.5 does not support 3.12+)
set -e
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt
echo "Done. Run ./startHost.sh to start the server."
