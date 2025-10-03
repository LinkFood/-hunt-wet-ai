#!/usr/bin/env python3
"""
Hunt Wet LLM Training Script - Fine-tune Llama 3.2 3B
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
import os

def train_hunt_llm():
    """Train Hunt Wet LLM using Llama 3.2 3B"""

    print("🦌 Hunt Wet LLM Training Starting...")

    # Model selection - using smaller Llama 3.2 3B for faster training
    model_name = "meta-llama/Llama-3.2-3B"

    print(f"📥 Loading model: {model_name}")

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token

    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="auto",
        use_cache=False
    )

    # Enable gradient checkpointing for memory efficiency
    model.gradient_checkpointing_enable()

    print("📊 Loading processed dataset...")
    # Load processed dataset
    dataset = load_from_disk('./hunt_processed_dataset')

    # Tokenize function
    def tokenize_function(examples):
        return tokenizer(
            examples['text'],
            truncation=True,
            padding=False,
            max_length=1024,  # Shorter for faster training
            return_special_tokens_mask=False
        )

    print("🔧 Tokenizing dataset...")
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

    # Training arguments - optimized for fast training
    training_args = TrainingArguments(
        output_dir="./hunt-llm-checkpoints",
        per_device_train_batch_size=1,  # Small batch for memory
        gradient_accumulation_steps=4,   # Accumulate gradients
        num_train_epochs=2,              # Fewer epochs for faster training
        learning_rate=5e-5,              # Slightly higher learning rate
        fp16=True,                       # Use half precision
        logging_steps=5,
        save_steps=50,
        save_total_limit=2,
        warmup_steps=50,
        dataloader_drop_last=True,
        report_to=None  # Disable wandb for simplicity
    )

    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        data_collator=data_collator,
        tokenizer=tokenizer
    )

    print("🚀 Starting training...")
    trainer.train()

    print("💾 Saving Hunt Wet LLM...")
    trainer.save_model("./hunt-wet-llm-final")
    tokenizer.save_pretrained("./hunt-wet-llm-final")

    print("🎉 Hunt Wet LLM training complete!")
    print("📁 Model saved to: ./hunt-wet-llm-final")

if __name__ == "__main__":
    train_hunt_llm()