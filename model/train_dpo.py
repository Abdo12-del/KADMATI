#!/usr/bin/env python3
"""
Aurova Model — preference stage (DPO) on top of the SFT adapter.

Input: model/data/dpo.jsonl produced by `npm run model:dataset` from users' opt-in feedback
exports ({prompt:[system,user], chosen, rejected}). "chosen" is the outline after the user edited
it; "rejected" is what the model produced. This teaches the *taste* that rules can't encode.

    pip install -r model/requirements.txt trl>=0.9
    python model/train_dpo.py --base Qwen/Qwen2.5-7B-Instruct --sft model/checkpoints/aurova-deck-1 --out model/checkpoints/aurova-deck-1-dpo
"""
import argparse, json
from pathlib import Path

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--base', default='Qwen/Qwen2.5-7B-Instruct')
    p.add_argument('--sft', required=True, help='SFT LoRA adapter dir from train.py')
    p.add_argument('--data', default='model/data/dpo.jsonl')
    p.add_argument('--out', default='model/checkpoints/aurova-deck-1-dpo')
    p.add_argument('--epochs', type=float, default=2)
    p.add_argument('--lr', type=float, default=5e-6)
    p.add_argument('--beta', type=float, default=0.1)
    p.add_argument('--min-pairs', type=int, default=50)
    a = p.parse_args()

    rows = [json.loads(l) for l in Path(a.data).read_text(encoding='utf-8').splitlines() if l.strip()]
    if len(rows) < a.min_pairs:
        raise SystemExit(f'only {len(rows)} preference pairs; collect at least {a.min_pairs} before running DPO')

    import torch
    from datasets import Dataset
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from peft import PeftModel
    from trl import DPOConfig, DPOTrainer

    tok = AutoTokenizer.from_pretrained(a.base, trust_remote_code=True)
    tok.pad_token = tok.pad_token or tok.eos_token
    ds = Dataset.from_list([{
        'prompt': tok.apply_chat_template(r['prompt'], tokenize=False, add_generation_prompt=True),
        'chosen': r['chosen'] + tok.eos_token,
        'rejected': r['rejected'] + tok.eos_token,
    } for r in rows]).train_test_split(test_size=0.1, seed=20260916)

    base = AutoModelForCausalLM.from_pretrained(a.base, torch_dtype=torch.bfloat16, device_map='auto', trust_remote_code=True)
    model = PeftModel.from_pretrained(base, a.sft, is_trainable=True)
    cfg = DPOConfig(output_dir=a.out, num_train_epochs=a.epochs, learning_rate=a.lr, beta=a.beta,
                    per_device_train_batch_size=1, gradient_accumulation_steps=8, bf16=True,
                    logging_steps=5, eval_strategy='epoch', save_strategy='epoch', report_to='none',
                    max_length=3072, max_prompt_length=1024, gradient_checkpointing=True)
    trainer = DPOTrainer(model=model, ref_model=None, args=cfg, train_dataset=ds['train'], eval_dataset=ds['test'], processing_class=tok)
    trainer.train()
    model.save_pretrained(a.out)
    tok.save_pretrained(a.out)
    print('DPO adapter →', a.out)

if __name__ == '__main__':
    main()
