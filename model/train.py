#!/usr/bin/env python3
"""
Aurova Model — LoRA/QLoRA fine-tune on the chat JSONL produced by `npm run model:dataset`.

    pip install -r model/requirements.txt
    python model/train.py --base Qwen/Qwen2.5-7B-Instruct --out model/checkpoints/aurova-deck-1
    python model/train.py --base Qwen/Qwen2.5-1.5B-Instruct --out model/checkpoints/aurova-deck-1-mini --epochs 4

Design choices
  • Base: Qwen2.5-Instruct — strong Arabic, Apache-2.0, native chat template, JSON-friendly.
  • QLoRA (4-bit) by default so a 7B fits a single 24 GB GPU; pass --no-4bit on bigger cards.
  • Loss only on assistant tokens (prompt is masked) — we teach the *answer*, not the prompt.
  • Task weighting: gold outlines are duplicated ×3, teacher-distilled ×2, planner ×1.
  • Optional merge (--merge) writes a plain HF checkpoint that vLLM/llama.cpp can serve directly.
"""
import argparse, json, os, random
from pathlib import Path

def parse():
    p = argparse.ArgumentParser()
    p.add_argument('--base', default='Qwen/Qwen2.5-7B-Instruct')
    p.add_argument('--train', default='model/data/train.distilled.jsonl' if Path('model/data/train.distilled.jsonl').exists() else 'model/data/train.jsonl')
    p.add_argument('--valid', default='model/data/valid.jsonl')
    p.add_argument('--out', default='model/checkpoints/aurova-deck-1')
    p.add_argument('--epochs', type=float, default=3)
    p.add_argument('--lr', type=float, default=2e-4)
    p.add_argument('--rank', type=int, default=32)
    p.add_argument('--alpha', type=int, default=64)
    p.add_argument('--max-len', type=int, default=3072)
    p.add_argument('--batch', type=int, default=2)
    p.add_argument('--grad-accum', type=int, default=8)
    p.add_argument('--no-4bit', action='store_true')
    p.add_argument('--merge', action='store_true', help='merge LoRA into base weights and save full model')
    p.add_argument('--seed', type=int, default=20260916)
    return p.parse_args()

WEIGHT = {'gold': 3, 'teacher': 2, 'planner': 1, 'synthetic': 2}

def load(path, weighted):
    rows = []
    for line in Path(path).read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        ex = json.loads(line)
        n = WEIGHT.get(ex.get('meta', {}).get('source'), 1) if weighted else 1
        rows.extend([ex['messages']] * n)
    return rows

def main():
    a = parse()
    random.seed(a.seed)
    import torch
    from datasets import Dataset
    from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForSeq2Seq, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

    tok = AutoTokenizer.from_pretrained(a.base, trust_remote_code=True)
    tok.pad_token = tok.pad_token or tok.eos_token

    def encode(messages):
        # prompt = everything up to the assistant turn; label only the assistant tokens
        prompt = tok.apply_chat_template(messages[:-1], tokenize=False, add_generation_prompt=True)
        full = prompt + messages[-1]['content'] + tok.eos_token
        p_ids = tok(prompt, add_special_tokens=False)['input_ids']
        f_ids = tok(full, add_special_tokens=False)['input_ids'][: a.max_len]
        labels = [-100] * min(len(p_ids), len(f_ids)) + f_ids[len(p_ids):]
        return {'input_ids': f_ids, 'attention_mask': [1] * len(f_ids), 'labels': labels}

    train_rows = load(a.train, weighted=True)
    random.shuffle(train_rows)
    valid_rows = load(a.valid, weighted=False)
    train_ds = Dataset.from_list([encode(m) for m in train_rows])
    valid_ds = Dataset.from_list([encode(m) for m in valid_rows])
    print(f'train {len(train_ds)} (weighted) · valid {len(valid_ds)}')

    quant = None if a.no_4bit else BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type='nf4', bnb_4bit_compute_dtype=torch.bfloat16, bnb_4bit_use_double_quant=True)
    model = AutoModelForCausalLM.from_pretrained(a.base, quantization_config=quant, torch_dtype=torch.bfloat16, device_map='auto', trust_remote_code=True)
    if quant:
        model = prepare_model_for_kbit_training(model)
    lora = LoraConfig(r=a.rank, lora_alpha=a.alpha, lora_dropout=0.05, bias='none', task_type='CAUSAL_LM',
                      target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'])
    model = get_peft_model(model, lora)
    model.print_trainable_parameters()

    args = TrainingArguments(
        output_dir=a.out, num_train_epochs=a.epochs, learning_rate=a.lr, lr_scheduler_type='cosine', warmup_ratio=0.03,
        per_device_train_batch_size=a.batch, per_device_eval_batch_size=a.batch, gradient_accumulation_steps=a.grad_accum,
        bf16=True, logging_steps=10, eval_strategy='epoch', save_strategy='epoch', save_total_limit=2,
        load_best_model_at_end=True, metric_for_best_model='eval_loss', report_to='none', seed=a.seed,
        gradient_checkpointing=True, group_by_length=True,
    )
    trainer = Trainer(model=model, args=args, train_dataset=train_ds, eval_dataset=valid_ds,
                      data_collator=DataCollatorForSeq2Seq(tok, pad_to_multiple_of=8, label_pad_token_id=-100))
    trainer.train()
    model.save_pretrained(a.out)
    tok.save_pretrained(a.out)
    Path(a.out, 'aurova.json').write_text(json.dumps({'base': a.base, 'train': a.train, 'epochs': a.epochs, 'rank': a.rank, 'examples': len(train_ds)}, indent=2))
    print('LoRA adapter →', a.out)

    if a.merge:
        merged_dir = a.out + '-merged'
        base = AutoModelForCausalLM.from_pretrained(a.base, torch_dtype=torch.bfloat16, device_map='cpu', trust_remote_code=True)
        from peft import PeftModel
        merged = PeftModel.from_pretrained(base, a.out).merge_and_unload()
        merged.save_pretrained(merged_dir, safe_serialization=True)
        tok.save_pretrained(merged_dir)
        print('merged model →', merged_dir)

if __name__ == '__main__':
    main()
