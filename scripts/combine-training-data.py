#!/usr/bin/env python3
"""
Combine all Hunt Wet training datasets for LLM training
"""

import json
import os

def combine_all_datasets():
    """Combine all training datasets into one comprehensive file"""

    all_data = []
    datasets = [
        'hunt_wet_expanded_training.json',
        'hunt_wet_massive_training.json'
    ]

    for dataset_file in datasets:
        if os.path.exists(dataset_file):
            print(f"📊 Loading {dataset_file}...")
            with open(dataset_file, 'r') as f:
                data = json.load(f)
                all_data.extend(data)
                print(f"   Added {len(data)} entries")

    # Add additional rapid training entries if they exist
    if os.path.exists('scripts/hunt_wet_expanded_training.json'):
        print("📊 Loading scripts/hunt_wet_expanded_training.json...")
        with open('scripts/hunt_wet_expanded_training.json', 'r') as f:
            data = json.load(f)
            all_data.extend(data)
            print(f"   Added {len(data)} entries")

    # Remove duplicates based on instruction + input combination
    seen = set()
    unique_data = []
    for entry in all_data:
        key = f"{entry.get('instruction', '')}{entry.get('input', '')}"
        if key not in seen:
            seen.add(key)
            unique_data.append(entry)

    print(f"🔄 Removed {len(all_data) - len(unique_data)} duplicate entries")

    # Save final combined dataset
    final_dataset = {
        'training_data': unique_data,
        'total_entries': len(unique_data),
        'created_for': 'Hunt Wet LLM Training',
        'ready_for_training': True
    }

    with open('hunt_wet_final_training.json', 'w') as f:
        json.dump(final_dataset, f, indent=2)

    # Save as JSONL for training platforms
    with open('hunt_wet_final_training.jsonl', 'w') as f:
        for entry in unique_data:
            f.write(json.dumps(entry) + '\n')

    return unique_data

if __name__ == "__main__":
    print("🦌 COMBINING ALL HUNT WET TRAINING DATA...")

    dataset = combine_all_datasets()

    print(f"✅ Final dataset ready!")
    print(f"📊 Total entries: {len(dataset):,}")
    print(f"💾 Saved to:")
    print(f"   - hunt_wet_final_training.json")
    print(f"   - hunt_wet_final_training.jsonl")
    print(f"🚀 READY FOR RUNPOD LLM TRAINING TONIGHT!")