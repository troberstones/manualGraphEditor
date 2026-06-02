MOONRAY_SETUP="/Applications/MoonRay/installs/openmoonray/scripts/setup.sh"
if [ -f "$MOONRAY_SETUP" ]; then
    source "$MOONRAY_SETUP"
    # Strip Moonray's Python 3.9 paths so the venv's usd-core is used instead
    PYTHONPATH=$(echo "$PYTHONPATH" | tr ':' '\n' | grep -v '/Applications/MoonRay' | tr '\n' ':' | sed 's/:$//')
    # Add back scene_rdl2 only (not full MoonRay pxr, which conflicts with venv usd-core)
    PYTHONPATH="/Applications/MoonRay/installs/openmoonray/python/lib/python3.9:${PYTHONPATH}"
    export PYTHONPATH
fi

source "$(dirname "$0")/.venv/bin/activate"
python3 host.py
