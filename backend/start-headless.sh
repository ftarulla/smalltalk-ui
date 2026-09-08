#!/usr/bin/env bash
# Script to launch Cuis-Smalltalk / CuisUniversity with the SmalltalkUI WebServer running

CUIS_VM="${CUIS_VM:-squeak}"
CUIS_IMAGE="${CUIS_IMAGE:-CuisUniversity.image}"
SERVER_FILE="$(cd "$(dirname "$0")" && pwd)/CuisWebServer.st"

if [ ! -f "$CUIS_IMAGE" ]; then
    # Look in common Cuis directories
    for img in *.image Cuis-Smalltalk-Dev/*.image ../*.image; do
        if [ -f "$img" ]; then
            CUIS_IMAGE="$img"
            break
        fi
    done
fi

echo "========================================================"
echo "  SmalltalkUI - Cuis University Headless Server Launcher"
echo "========================================================"
echo "VM:    $CUIS_VM"
echo "Image: $CUIS_IMAGE"
echo "Server File: $SERVER_FILE"
echo ""

# Smalltalk startup script to filein and start server
STARTUP_SCRIPT=$(cat <<EOF
Transcript show: 'Filing in SmalltalkUIWebServer...'; cr.
'$SERVER_FILE' asFileEntry fileIn.
SmalltalkUIWebServer startOn: 8080.
Transcript show: 'SmalltalkUI Server is listening on http://localhost:8080'; cr.
EOF
)

if command -v "$CUIS_VM" >/dev/null 2>&1; then
    echo "Starting Cuis VM in headless mode on port 8080..."
    "$CUIS_VM" -headless "$CUIS_IMAGE" -e "$STARTUP_SCRIPT"
else
    echo "Note: '$CUIS_VM' command not found in PATH."
    echo "To run manually in your Cuis University image:"
    echo "1. File in 'backend/CuisWebServer.st' into your Cuis image."
    echo "2. Evaluate in a Workspace: SmalltalkUIWebServer startOn: 8080."
fi
