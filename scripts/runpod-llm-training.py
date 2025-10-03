#!/usr/bin/env python3
"""
Hunt Wet LLM Training on RunPod
Secure, self-hosted LLM training for complete ownership
"""

import os
import json
from pathlib import Path

class HuntWetLLMTraining:
    def __init__(self):
        self.model_name = "hunt-wet-llm-v1"
        self.base_model = "meta-llama/Llama-3.1-8B"

    def setup_runpod_environment(self):
        """Instructions for RunPod GPU setup"""

        setup_script = """
# Hunt Wet LLM Training Setup on RunPod A100
# This ensures YOU own everything

# 1. Rent RunPod A100 GPU
# Go to runpod.io -> GPU Cloud -> A100 80GB
# Select "PyTorch 2.1" template
# Storage: 200GB+
# Cost: ~$2.50/hour

# 2. SSH into your RunPod instance
ssh root@your-runpod-ip

# 3. Install Unsloth (fastest LLM training)
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes

# 4. Upload your training data
# scp hunt_wet_training_data.json root@runpod-ip:/workspace/

# 5. Run training script (below)
python train_hunt_wet_llm.py
"""

        with open('/tmp/claude/runpod_setup.sh', 'w') as f:
            f.write(setup_script)

        print("📋 RunPod setup instructions saved to: /tmp/claude/runpod_setup.sh")

    def generate_training_script(self):
        """Generate the actual training script for Hunt Wet LLM"""

        training_script = '''
import json
from unsloth import FastLanguageModel
import torch
from datasets import Dataset
from trl import SFTTrainer
from transformers import TrainingArguments
import os

class HuntWetLLMTrainer:
    def __init__(self):
        self.model = None
        self.tokenizer = None

    def setup_model(self):
        """Load and configure Llama 3.1 8B for hunting fine-tuning"""

        print("🦌 Loading Llama 3.1 8B for hunting training...")

        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name = "unsloth/Meta-Llama-3.1-8B",
            max_seq_length = 2048,
            dtype = None,  # Auto-detect
            load_in_4bit = True,  # Memory efficient
        )

        # Configure for fine-tuning
        self.model = FastLanguageModel.get_peft_model(
            self.model,
            r = 16,  # LoRA rank
            target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                            "gate_proj", "up_proj", "down_proj"],
            lora_alpha = 16,
            lora_dropout = 0,
            bias = "none",
            use_gradient_checkpointing = "unsloth",
            random_state = 3407,
            use_rslora = False,
            loftq_config = None,
        )

        print("✅ Model configured for hunting intelligence training")

    def load_training_data(self, data_file="hunt_wet_training_data.json"):
        """Load hunting knowledge training data"""

        with open(data_file, 'r') as f:
            raw_data = json.load(f)

        # Format for chat template
        formatted_data = []
        for item in raw_data:
            chat_format = {
                "text": f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are Hunt Wet AI, the world's first hunting-specific artificial intelligence. You understand wildlife behavior, environmental conditions, and hunting strategies based on scientific data and decades of hunter experiences.<|eot_id|><|start_header_id|>user<|end_header_id|>

{item['instruction']}

Context: {item['input']}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{item['output']}<|eot_id|>"""
            }
            formatted_data.append(chat_format)

        return Dataset.from_list(formatted_data)

    def train_hunt_wet_llm(self):
        """Train the hunting-specific LLM"""

        print("🚀 Starting Hunt Wet LLM training...")

        # Load training data
        dataset = self.load_training_data()
        print(f"📚 Loaded {len(dataset)} hunting knowledge entries")

        # Training configuration
        trainer = SFTTrainer(
            model = self.model,
            tokenizer = self.tokenizer,
            train_dataset = dataset,
            dataset_text_field = "text",
            max_seq_length = 2048,
            dataset_num_proc = 2,
            packing = False,
            args = TrainingArguments(
                per_device_train_batch_size = 2,
                gradient_accumulation_steps = 4,
                warmup_steps = 5,
                max_steps = 1000,  # Adjust based on data size
                learning_rate = 2e-4,
                fp16 = not torch.cuda.is_bf16_supported(),
                bf16 = torch.cuda.is_bf16_supported(),
                logging_steps = 1,
                optim = "adamw_8bit",
                weight_decay = 0.01,
                lr_scheduler_type = "linear",
                seed = 3407,
                output_dir = "hunt-wet-llm-output",
                report_to = "none",  # No external logging
            ),
        )

        # Start training
        trainer.train()
        print("✅ Training complete!")

        # Save the model
        self.save_hunt_wet_model()

    def save_hunt_wet_model(self):
        """Save the trained Hunt Wet LLM"""

        print("💾 Saving Hunt Wet LLM...")

        # Save with FastLanguageModel (recommended)
        self.model.save_pretrained("hunt-wet-llm-final")
        self.tokenizer.save_pretrained("hunt-wet-llm-final")

        # Also save as standard format for deployment
        self.model.save_pretrained_merged(
            "hunt-wet-llm-merged",
            self.tokenizer,
            save_method = "merged_16bit"
        )

        print("🎉 Hunt Wet LLM saved successfully!")
        print("Files saved to: hunt-wet-llm-final/ and hunt-wet-llm-merged/")
        print("These are YOUR model files - download them!")

# Run the training
if __name__ == "__main__":
    trainer = HuntWetLLMTrainer()
    trainer.setup_model()
    trainer.train_hunt_wet_llm()

    print("🦌 HUNT WET LLM TRAINING COMPLETE! 🦌")
    print("Your hunting AI is ready to deploy.")
'''

        with open('/tmp/claude/train_hunt_wet_llm.py', 'w') as f:
            f.write(training_script)

        print("🐍 Training script saved to: /tmp/claude/train_hunt_wet_llm.py")

    def generate_deployment_script(self):
        """Create deployment script for the trained model"""

        deployment_script = '''
# Hunt Wet LLM Deployment Script
# Deploy YOUR trained hunting LLM

from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from flask import Flask, request, jsonify

class HuntWetLLMServer:
    def __init__(self, model_path="hunt-wet-llm-merged"):
        print("🦌 Loading Hunt Wet LLM...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        print("✅ Hunt Wet LLM loaded and ready!")

    def generate_hunting_advice(self, question, context=""):
        """Generate hunting advice using your trained LLM"""

        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are Hunt Wet AI, the world's first hunting-specific artificial intelligence.<|eot_id|><|start_header_id|>user<|end_header_id|>

{question}

Context: {context}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""

        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )

        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response.split("assistant")[-1].strip()

# Create Flask API
app = Flask(__name__)
hunt_llm = HuntWetLLMServer()

@app.route('/hunt-advice', methods=['POST'])
def hunting_advice():
    data = request.json
    question = data.get('question', '')
    context = data.get('context', '')

    advice = hunt_llm.generate_hunting_advice(question, context)

    return jsonify({
        'advice': advice,
        'source': 'Hunt Wet LLM v1.0'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
'''

        with open('/tmp/claude/deploy_hunt_wet_llm.py', 'w') as f:
            f.write(deployment_script)

        print("🚀 Deployment script saved to: /tmp/claude/deploy_hunt_wet_llm.py")

    def calculate_costs(self):
        """Calculate realistic costs for Hunt Wet LLM"""

        costs = {
            "Training (One-time)": {
                "RunPod A100 80GB": "$2.50/hour × 48 hours = $120",
                "Storage (200GB)": "$20",
                "Total Training": "$140"
            },
            "Deployment (Monthly)": {
                "RunPod RTX 4090 24/7": "$0.50/hour × 730 hours = $365",
                "Alternative: Modal serverless": "$200-400/month",
                "Storage": "$10/month"
            },
            "Total Investment": {
                "Year 1": "$140 + ($365 × 12) = $4,520",
                "Ongoing": "$365-400/month"
            }
        }

        print("💰 Hunt Wet LLM Cost Breakdown:")
        for category, items in costs.items():
            print(f"\n{category}:")
            for item, cost in items.items():
                print(f"  • {item}: {cost}")

    def generate_complete_setup(self):
        """Generate all files needed for Hunt Wet LLM"""

        print("🦌 Generating Hunt Wet LLM complete setup...")

        self.setup_runpod_environment()
        self.generate_training_script()
        self.generate_deployment_script()
        self.calculate_costs()

        print("\n🎉 HUNT WET LLM SETUP COMPLETE!")
        print("\nNext steps:")
        print("1. Run the data scraper to collect hunting knowledge")
        print("2. Follow RunPod setup instructions")
        print("3. Upload data and run training script")
        print("4. Download YOUR trained model files")
        print("5. Deploy with the deployment script")
        print("\nYou'll own the world's first hunting LLM! 🚀")

if __name__ == "__main__":
    trainer = HuntWetLLMTraining()
    trainer.generate_complete_setup()