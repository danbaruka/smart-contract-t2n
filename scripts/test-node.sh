#!/bin/bash
# Quick test if node is responding

TARGET_DIR="${TARGET_DIR:-$HOME/cardano-testnet}"
SOCKET_PATH="$TARGET_DIR/db/node.socket"

echo "Testing connection to cardano-node..."
echo "Socket: $SOCKET_PATH"
echo ""

if timeout 5 cardano-cli conway query tip --testnet-magic 1 --socket-path "$SOCKET_PATH"; then
    echo ""
    echo "✅ Node is responding!"
else
    echo ""
    echo "❌ Node not responding"
    echo ""
    echo "Start node with:"
    echo "cd $TARGET_DIR && cardano-node run --topology topology.json --database-path db --socket-path db/node.socket --port 3001 --config config.json"
fi
