#!/usr/bin/env python3
"""
Test your trained Hunt Wet LLM
"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

def test_hunt_llm():
    """Test the trained Hunt Wet LLM"""

    print("🦌 Loading Hunt Wet LLM...")

    # Load your trained model
    model_path = "./hunt-wet-llm-final"

    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch.float16,
        device_map="auto"
    )

    print("✅ Hunt Wet LLM loaded successfully!")

    # Test questions
    test_questions = [
        "What's the best time to hunt deer?",
        "How do I set up a tree stand safely?",
        "What caliber should I use for elk hunting?",
        "How do I track a wounded deer?"
    ]

    for question in test_questions:
        print(f"\n🎯 Question: {question}")

        # Format input
        prompt = f"Human: {question}\n\nAssistant:"

        # Tokenize
        inputs = tokenizer(prompt, return_tensors="pt")

        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                max_new_tokens=200,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )

        # Decode response
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Extract just the assistant's response
        assistant_response = response.split("Assistant:")[-1].strip()

        print(f"🤖 Hunt Wet LLM: {assistant_response}")
        print("-" * 50)

if __name__ == "__main__":
    test_hunt_llm()