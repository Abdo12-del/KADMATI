#!/usr/bin/env bash
# Serve the fine-tuned checkpoint behind the Aurova gateway.
#   ./model/serve.sh                       # vLLM, merged 7B
#   ./model/serve.sh mini                  # vLLM, merged mini
#   ENGINE=llama ./model/serve.sh          # llama.cpp server with a GGUF export (CPU/Metal)
set -euo pipefail
cd "$(dirname "$0")/.."
VARIANT="${1:-deck}"
ENGINE="${ENGINE:-vllm}"
case "$VARIANT" in
  mini) CKPT=model/checkpoints/aurova-deck-1-mini-merged; NAME=aurova-deck-1-mini ;;
  *)    CKPT=model/checkpoints/aurova-deck-1-merged;      NAME=aurova-deck-1 ;;
esac
PORT_MODEL="${PORT_MODEL:-8000}"

if [ "$ENGINE" = "vllm" ]; then
  # guided JSON decoding is enabled per request via response_format; vLLM honours it natively.
  vllm serve "$CKPT" --served-model-name "$NAME" --port "$PORT_MODEL" --max-model-len 4096 --dtype bfloat16 &
else
  GGUF="${GGUF:-$CKPT/model-q5_k_m.gguf}"
  llama-server -m "$GGUF" --alias "$NAME" --port "$PORT_MODEL" -c 4096 --jinja &
fi
MODEL_PID=$!
trap 'kill $MODEL_PID' EXIT

# Gateway: holds no key for a local upstream; maps both public names to the one loaded checkpoint.
AUROVA_UPSTREAM_URL="http://127.0.0.1:$PORT_MODEL/v1/chat/completions" \
AUROVA_MODEL_DECK="$NAME" AUROVA_MODEL_MINI="$NAME" \
node server/aurova-gateway.mjs
