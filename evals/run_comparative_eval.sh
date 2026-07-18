#!/bin/bash
set -e

echo "=== Waiting for image generation to complete ==="
while pgrep -f "generate-hairstyle-refs.ts" >/dev/null; do
  echo "Image generation still running... (checking every 30s)"
  sleep 30
done
echo "✓ Image generation complete"

echo ""
echo "=== Running Comparative Evaluation: Qwen vs Gemma4 ==="
mkdir -p hairstyle/reports

# Build model list for each stage
VISION_MODELS="qwen3-vl:8b,gemma4:12b-mlx,gemma4:e4b,gemma4:e2b-mlx"
TEXT_MODELS="qwen3.5:9b,gemma4:12b-mlx,gemma4:e4b,gemma4:e2b-mlx"

echo ""
echo "Stage 1: Analyze (Vision) on all 6 fixtures, locale ko"
echo "Models: $VISION_MODELS"
uv run python hairstyle/run.py \
  --stage analyze \
  --models "$VISION_MODELS" \
  --locale ko \
  --limit 6

echo ""
echo "Stage 2: Recommend (Text) on 2 representative inputs, locale ko"
echo "Models: $TEXT_MODELS"
uv run python hairstyle/run.py \
  --stage recommend \
  --models "$TEXT_MODELS" \
  --locale ko \
  --limit 2

echo ""
echo "=== Evaluation Complete ==="
ls -lah hairstyle/reports/report-*.md | tail -2
