"""
Template Filler (Python)

Features:
- Read template from file or stdin
- Read variables from:
  • JSON file
  • CLI --var KEY=VALUE
  • Excel file (one row = one output)
- Generate single output or batch outputs
- Supports placeholders:
    ${KEY}
    {{KEY}}
    "KEY"
    bare KEY (word boundary)

Usage examples:

Single run (JSON):
    python fill_excel.py --template cover.txt --out filled.txt --vars vars.json

Single run (CLI vars):
    python fill_excel.py --template cover.txt --var JOB_ROLE="Data Scientist"

Batch run (Excel):
    python fill_excel.py --template cover.txt --excel vars.xlsx --out-dir outputs/

Pipe input:
    cat cover.txt | python fill_excel.py --var JOB_ROLE="Data Scientist"
"""

import argparse
import json
import sys
import re
import pathlib

import pandas as pd


# -----------------------------
# Variable Loaders
# -----------------------------

def load_vars_from_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return {str(k): str(v) for k, v in json.load(f).items()}


def load_vars_from_cli(cli_vars):
    data = {}
    for kv in cli_vars or []:
        if '=' in kv:
            k, v = kv.split('=', 1)
            data[k] = v
    return data


def load_excel_vars(path):
    df = pd.read_excel(path)
    records = df.to_dict(orient='records')

    cleaned = []
    for row in records:
        cleaned.append({
            str(k): "" if pd.isna(v) else str(v)
            for k, v in row.items()
        })
    return cleaned


# -----------------------------
# Template Filling Logic
# -----------------------------

def fill_template(template_text, mapping):
    out = template_text

    for k, v in mapping.items():
        # ${KEY}
        out = re.sub(r'\$\{\s*' + re.escape(k) + r'\s*\}', v, out)

        # {{KEY}}
        out = re.sub(r'\{\{\s*' + re.escape(k) + r'\s*\}\}', v, out)

        # "KEY"
        out = out.replace(f'"{k}"', v)

        # bare KEY
        out = re.sub(r'\b' + re.escape(k) + r'\b', v, out)

    return out


# -----------------------------
# Main
# -----------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--template', '-t', help='Template file (omit to read stdin)')
    parser.add_argument('--out', '-o', help='Output file (single mode)')
    parser.add_argument('--vars', help='JSON file with variables')
    parser.add_argument('--var', action='append', help='Individual variable KEY=VALUE')
    parser.add_argument('--excel', help='Excel file (one row per output)')
    parser.add_argument('--out-dir', help='Output directory for Excel batch mode')

    args = parser.parse_args()

    # Load template
    if args.template:
        template_text = pathlib.Path(args.template).read_text(encoding='utf-8')
    else:
        template_text = sys.stdin.read()

    # -----------------------------
    # Excel Batch Mode
    # -----------------------------
    if args.excel:
        rows = load_excel_vars(args.excel)
        out_dir = pathlib.Path(args.out_dir or '.')
        out_dir.mkdir(parents=True, exist_ok=True)

        for i, mapping in enumerate(rows, start=1):
            result = fill_template(template_text, mapping)

            filename = mapping.get(
                'OUTPUT_FILE',
                f'filled_{mapping.get("JOB_ROLE", i)}.txt'
            )

            (out_dir / filename).write_text(result, encoding='utf-8')

    # -----------------------------
    # Single Output Mode
    # -----------------------------
    else:
        mapping = {}

        if args.vars:
            mapping.update(load_vars_from_json(args.vars))

        mapping.update(load_vars_from_cli(args.var))

        result = fill_template(template_text, mapping)

        if args.out:
            pathlib.Path(args.out).write_text(result, encoding='utf-8')
        else:
            sys.stdout.write(result)


if __name__ == '__main__':
    main()
