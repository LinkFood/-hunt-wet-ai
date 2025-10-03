#!/usr/bin/env python3
"""
Process Hunt Wet training data for LLM fine-tuning
"""

import json
from datasets import Dataset

def process_hunt_data():
    """Process JSONL training data into HuggingFace dataset format"""

    print("📊 Processing Hunt Wet training data...")

    # Read JSONL file
    texts = []
    with open('hunt_training_data.jsonl', 'r') as f:
        for line in f:
            data = json.loads(line.strip())
            texts.append(data['text'])

    print(f"✅ Loaded {len(texts)} training examples")

    # Create dataset
    dataset = Dataset.from_dict({'text': texts})

    # Save processed dataset
    dataset.save_to_disk('./hunt_processed_dataset')
    print("✅ Processed dataset saved to ./hunt_processed_dataset")

    return dataset

if __name__ == "__main__":
    process_hunt_data()