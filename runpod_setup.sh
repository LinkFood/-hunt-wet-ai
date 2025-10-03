#!/bin/bash
# Hunt Wet LLM - RunPod Setup & Training Script
# Run this on your RunPod GPU instance

set -e
echo "🦌 HUNT WET LLM - RUNPOD SETUP STARTING..."

# Install required packages
echo "📦 Installing PyTorch and dependencies..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install transformers datasets accelerate
pip install huggingface_hub

# Login to Hugging Face (you'll need to paste your token)
echo "🔑 Please login to Hugging Face to download Llama model:"
echo "Visit: https://huggingface.co/settings/tokens to get your token"
huggingface-cli login

# Process training data
echo "📊 Processing Hunt Wet training data..."
python process_data.py

# Start LLM training
echo "🤖 Starting Hunt Wet LLM training..."
python train_llm.py

echo ""
echo "🎉 HUNT WET LLM TRAINING COMPLETE!"
echo "📁 Your trained model is in: ./hunt-wet-llm-final/"
echo "💰 Training cost: ~$3-8 depending on GPU and time"
echo ""
echo "🔧 To test your model, run:"
echo "python test_model.py"