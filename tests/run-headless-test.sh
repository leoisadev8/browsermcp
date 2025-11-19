#!/bin/bash

# Start Mock Extension in background
echo "Starting Mock Extension..."
bun run tests/mock-extension.ts > mock_ext.log 2>&1 &
MOCK_PID=$!

echo "Waiting for mock extension to initialize..."
sleep 2

# Test 1: Navigate
echo "---------------------------------------------------"
echo "Test 1: Navigate to example.com"
echo "---------------------------------------------------"
droid exec -m glm-4.6 --auto high "navigate to https://example.com" 

# Test 2: Read Content
echo "---------------------------------------------------"
echo "Test 2: Read Content"
echo "---------------------------------------------------"
droid exec -m glm-4.6 --auto high "get the content of the current page"

# Cleanup
echo "Killing Mock Extension ($MOCK_PID)..."
kill $MOCK_PID
echo "Done."
