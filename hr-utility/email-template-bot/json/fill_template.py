"""
Template Filler (Python): CLI script: reads a template file (or stdin), reads variables (JSON file or KEY=VALUE pairs), and prints or writes the filled output. Supports placeholders in these forms: ${KEY}, {{KEY}}, "KEY", or bare KEY.

Usage examples:
    python fill_template.py --template cover.txt --out filled.txt --vars vars.json
    python fill_template.py --template cover.txt --var JOB_ROLE="Data Scientist" --var JOB_ID=123 --var COMPANY_NAME=Acme
    cat cover.txt | python fill_template.py --var JOB_ROLE="Data Scientist"

"""
import argparse, json, sys, re, pathlib

def load_vars(args):
        data = {}
        if args.vars:
                with open(args.vars, 'r', encoding='utf-8') as f:
                        data.update(json.load(f))
        for kv in (args.var or []):
                if '=' in kv:
                        k,v = kv.split('=',1)
                        data[k] = v
        return {str(k): str(v) for k,v in data.items()}

def fill(template_text, mapping):
        out = template_text
        for k,v in mapping.items():
                # ${KEY}
                out = re.sub(r'\$\{\s*' + re.escape(k) + r'\s*\}', v, out)
                # {{KEY}}
                out = re.sub(r'\{\{\s*' + re.escape(k) + r'\s*\}\}', v, out)
                # "KEY" exact (handles "JOB_ROLE")
                out = out.replace(f'"{k}"', v)
                # bare KEY (word boundary)
                out = re.sub(r'\b' + re.escape(k) + r'\b', v, out)
        return out

def main():
        p = argparse.ArgumentParser()
        p.add_argument('--template', '-t', help='template file (omit to read stdin)')
        p.add_argument('--out', '-o', help='output file (omit to write stdout)')
        p.add_argument('--vars', help='JSON file with variables')
        p.add_argument('--var', action='append', help='individual variable KEY=VALUE', metavar='KEY=VALUE')
        args = p.parse_args()

        if args.template:
                tpl = pathlib.Path(args.template).read_text(encoding='utf-8')
        else:
                tpl = sys.stdin.read()

        mapping = load_vars(args)
        result = fill(tpl, mapping)

        if args.out:
                pathlib.Path(args.out).write_text(result, encoding='utf-8')
        else:
                sys.stdout.write(result)

if __name__ == '__main__':
        main()
