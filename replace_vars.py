import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Regex to match Tailwind arbitrary CSS vars like text-[var(--lg-midnight)]
    # and replace with text-lg-midnight
    # This also matches bg-, border-, ring-, etc.
    pattern = re.compile(r'([a-z]+)-\[var\(--lg-([a-zA-Z0-9-]+)\)\]')
    
    new_content = pattern.sub(r'\1-lg-\2', content)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

