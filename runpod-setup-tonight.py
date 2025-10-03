#!/usr/bin/env python3
"""
Hunt Wet LLM - Complete RunPod Setup for Training Tonight
Full infrastructure setup for Llama 3.1 8B fine-tuning
"""

import json
import os

def create_runpod_training_setup():
    """Create complete RunPod infrastructure for Hunt Wet LLM training"""

    print("🚀 CREATING COMPLETE RUNPOD SETUP FOR HUNT WET LLM TRAINING TONIGHT...")

    # 1. Create RunPod training script
    training_script = '''#!/bin/bash
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
'''

    # 2. Create data processing script
    data_processor = '''#!/usr/bin/env python3
"""
Process Hunt Wet training data for Llama 3.1 fine-tuning
"""

import json
from datasets import Dataset
from transformers import AutoTokenizer

def process_hunt_wet_data():
    """Process training data into proper format"""

    print("📊 Processing Hunt Wet training data...")

    # Load training data
    with open('hunt_wet_final_training.json', 'r') as f:
        data = json.load(f)

    training_entries = data['training_data']

    # Format for instruction tuning
    formatted_data = []

    for entry in training_entries:
        # Create conversation format
        conversation = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{entry['system']}<|eot_id|><|start_header_id|>user<|end_header_id|>

{entry['instruction']}

Context: {entry['input']}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{entry['output']}<|eot_id|><|end_of_text|>"""

        formatted_data.append({
            'text': conversation
        })

    # Save processed data
    dataset = Dataset.from_list(formatted_data)
    dataset.save_to_disk('./hunt_wet_processed_dataset')

    print(f"✅ Processed {len(formatted_data)} training examples")

    # Save as JSON for backup
    with open('hunt_wet_processed_training.json', 'w') as f:
        json.dump(formatted_data, f, indent=2)

if __name__ == "__main__":
    process_hunt_wet_data()
'''

    # 3. Create main training script
    training_code = '''#!/usr/bin/env python3
"""
Hunt Wet LLM Training - Llama 3.1 8B Fine-tuning
"""

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import load_from_disk
import wandb
import os

def train_hunt_wet_llm():
    """Train Hunt Wet LLM using Llama 3.1 8B"""

    print("🤖 Starting Hunt Wet LLM training...")

    # Initialize wandb for monitoring
    wandb.init(project="hunt-wet-llm", name="llama-3.1-8b-hunt-wet")

    # Load model and tokenizer
    model_name = "./llama-3.1-8b-base"

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="auto",
        use_cache=False
    )

    # Enable gradient checkpointing for memory efficiency
    model.gradient_checkpointing_enable()

    # Load processed dataset
    dataset = load_from_disk('./hunt_wet_processed_dataset')

    # Tokenize dataset
    def tokenize_function(examples):
        return tokenizer(
            examples['text'],
            truncation=True,
            padding=False,
            max_length=2048,
            return_special_tokens_mask=False
        )

    tokenized_dataset = dataset.map(
        tokenize_function,
        batched=True,
        remove_columns=dataset.column_names
    )

    # Data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False
    )

    # Training arguments
    training_args = TrainingArguments(
        output_dir="./hunt-wet-llm-checkpoints",
        per_device_train_batch_size=2,
        gradient_accumulation_steps=8,
        num_train_epochs=3,
        learning_rate=2e-5,
        fp16=True,
        logging_steps=10,
        save_steps=50,
        save_total_limit=3,
        warmup_steps=100,
        report_to="wandb",
        run_name="hunt-wet-llm-training"
    )

    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        data_collator=data_collator,
        tokenizer=tokenizer
    )

    # Start training
    print("🚀 Starting training...")
    trainer.train()

    # Save final model
    print("💾 Saving Hunt Wet LLM...")
    trainer.save_model("./hunt-wet-llm-final")
    tokenizer.save_pretrained("./hunt-wet-llm-final")

    print("🎉 Hunt Wet LLM training complete!")
    print("📁 Model saved to: ./hunt-wet-llm-final")

if __name__ == "__main__":
    train_hunt_wet_llm()
'''

    # 4. Create deployment script
    deployment_script = '''#!/usr/bin/env python3
"""
Deploy Hunt Wet LLM for testing
"""

from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# Load trained model
print("🔄 Loading Hunt Wet LLM...")
tokenizer = AutoTokenizer.from_pretrained("./hunt-wet-llm-final")
model = AutoModelForCausalLM.from_pretrained(
    "./hunt-wet-llm-final",
    torch_dtype=torch.float16,
    device_map="auto"
)
print("✅ Hunt Wet LLM loaded!")

@app.route("/chat", methods=["POST"])
def chat():
    """Hunt Wet LLM chat endpoint"""

    data = request.json
    user_message = data.get("message", "")
    zip_code = data.get("zip_code", "")
    game_type = data.get("game_type", "deer")

    # Format prompt
    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are Hunt Wet AI, the world's first hunting-specific artificial intelligence. You have been trained on decades of hunting knowledge, wildlife research, and environmental data. You understand how weather patterns, barometric pressure, moon phases, and seasonal changes affect animal behavior and hunting success. Provide specific, actionable hunting advice based on scientific data and proven hunting strategies.<|eot_id|><|start_header_id|>user<|end_header_id|>

{user_message}

Context: ZIP code {zip_code}, hunting {game_type}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""

    # Generate response
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=0.7,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )

    response = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)

    return jsonify({"response": response.strip()})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "Hunt Wet LLM ready!", "model": "Llama 3.1 8B Hunt Wet"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
'''

    # 5. Create requirements file
    requirements = '''torch>=2.0.0
transformers>=4.30.0
datasets>=2.12.0
accelerate>=0.20.0
bitsandbytes>=0.41.0
wandb>=0.15.0
tensorboard>=2.13.0
flask>=2.3.0
'''

    # Save all files
    files_to_create = {
        'runpod_train.sh': training_script,
        'process_hunt_wet_data.py': data_processor,
        'train_hunt_wet_llm.py': training_code,
        'deploy_hunt_wet.py': deployment_script,
        'requirements.txt': requirements
    }

    for filename, content in files_to_create.items():
        with open(filename, 'w') as f:
            f.write(content)

        # Make shell scripts executable
        if filename.endswith('.sh'):
            os.chmod(filename, 0o755)

        print(f"✅ Created {filename}")

    # Create instructions
    instructions = '''
# 🦌 HUNT WET LLM TRAINING TONIGHT - COMPLETE INSTRUCTIONS

## STEP 1: Set up RunPod Instance
1. Go to runpod.io
2. Create account and add payment method
3. Launch A100 GPU instance (40GB or 80GB)
4. Choose PyTorch template
5. Cost: ~$1.50/hour for A100 40GB

## STEP 2: Upload Training Data
```bash
# Upload your training data to RunPod instance
scp hunt_wet_final_training.json root@your-runpod-ip:/workspace/
scp hunt_wet_final_training.jsonl root@your-runpod-ip:/workspace/
```

## STEP 3: Upload Training Scripts
```bash
# Upload all training files
scp runpod_train.sh root@your-runpod-ip:/workspace/
scp process_hunt_wet_data.py root@your-runpod-ip:/workspace/
scp train_hunt_wet_llm.py root@your-runpod-ip:/workspace/
scp deploy_hunt_wet.py root@your-runpod-ip:/workspace/
scp requirements.txt root@your-runpod-ip:/workspace/
```

## STEP 4: Start Training (ON RUNPOD)
```bash
# SSH into RunPod instance
ssh root@your-runpod-ip

# Make script executable and run
chmod +x runpod_train.sh
./runpod_train.sh
```

## STEP 5: Monitor Training
- Training will take 2-4 hours
- Monitor progress with wandb dashboard
- Watch for loss reduction and convergence

## STEP 6: Download Trained Model
```bash
# After training completes, download your model
scp -r root@your-runpod-ip:/workspace/hunt-wet-llm-final ./hunt-wet-llm-final/
```

## STEP 7: Test Locally
```bash
# Test your Hunt Wet LLM
cd hunt-wet-llm-final
python ../deploy_hunt_wet.py

# Test endpoint
curl -X POST http://localhost:8000/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Best hunting conditions for whitetail?", "zip_code": "21286", "game_type": "deer"}'
```

## 💰 ESTIMATED COSTS:
- Training: $6-12 (2-4 hours on A100)
- Total tonight: ~$10-15

## 🚨 IMPORTANT:
- This creates YOUR proprietary Hunt Wet LLM
- Model files are 100% owned by you
- No data leaves your control
- First hunting-specific LLM in the world!

## 🎯 READY TO START:
Your training data is ready (154 hunting knowledge entries)
All scripts are prepared for RunPod deployment
Launch RunPod instance and begin training tonight!
'''

    with open('HUNT_WET_LLM_TRAINING_INSTRUCTIONS.md', 'w') as f:
        f.write(instructions)

    print("✅ Created HUNT_WET_LLM_TRAINING_INSTRUCTIONS.md")

    print("\n🎉 COMPLETE RUNPOD SETUP READY!")
    print("📊 Training data: 154 hunting knowledge entries")
    print("🚀 All scripts prepared for RunPod deployment")
    print("💰 Estimated cost: $10-15 tonight")
    print("\n📖 Next step: Read HUNT_WET_LLM_TRAINING_INSTRUCTIONS.md")

if __name__ == "__main__":
    create_runpod_training_setup()