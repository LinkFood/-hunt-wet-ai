#!/bin/bash
# Hunt Wet LLM Training Script - RunPod A100
# Run this on your RunPod instance tonight

set -e
echo "🦌 HUNT WET LLM TRAINING STARTING..."

# Install required packages
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install transformers datasets accelerate bitsandbytes
pip install wandb tensorboard

# Download Llama 3.1 8B base model
echo "📥 Downloading Llama 3.1 8B base model..."
python -c "
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

model_name = 'meta-llama/Meta-Llama-3.1-8B'
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map='auto'
)
tokenizer.save_pretrained('./llama-3.1-8b-base')
model.save_pretrained('./llama-3.1-8b-base')
print('✅ Base model downloaded')
"

# Process training data
echo "📊 Processing Hunt Wet training data..."
python process_hunt_wet_data.py

# Start training
echo "🤖 Starting Hunt Wet LLM fine-tuning..."
python train_hunt_wet_llm.py

echo "🎉 HUNT WET LLM TRAINING COMPLETE!"
