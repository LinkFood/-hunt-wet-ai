#!/usr/bin/env python3
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
