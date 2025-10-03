#!/usr/bin/env python3
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
