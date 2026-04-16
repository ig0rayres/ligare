import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Regex to match border-lg-SOMETHING and divide-lg-SOMETHING
    pattern = re.compile(r'(border|divide)-lg-([a-zA-Z0-9-]+)')
    new_content = pattern.sub(r'\1-[var(--lg-\2)]', content)

    # Also check if hover:border-lg-SOMETHING or similar needs reverting
    # Handled by the generic regex above

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Reverted in {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

