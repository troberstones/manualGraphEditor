source /Applications/MoonRay/installs/openmoonray/scripts/setup.sh
source "$(dirname "$0")/.venv/bin/activate"
# Strip Moonray's Python 3.9 paths so the venv's usd-core is used instead
PYTHONPATH=$(echo "$PYTHONPATH" | tr ':' '\n' | grep -v '/Applications/MoonRay' | tr '\n' ':' | sed 's/:$//')
export PYTHONPATH
python3 host.py
