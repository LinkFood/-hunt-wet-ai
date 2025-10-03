#!/usr/bin/env python3
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
