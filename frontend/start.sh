#!/bin/bash
# Remove macOS quarantine attributes if present to prevent uv_cwd EPERM errors
xattr -r -d com.apple.provenance . 2>/dev/null || true
xattr -r -d com.apple.quarantine . 2>/dev/null || true

# Start the Expo app
npm start
