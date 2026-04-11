import os
import re

def fix_content(content):
    # 1. Bruteforce fix any method: line that has any quote mismatch
    # Search for method: followed by any quote, then capital letters, then any quote
    content = re.sub(r'method:\s*["\'`]([A-Z]+)["\'`]', r'method: "\1"', content)
    
    # 2. Fix Authorization headers more aggressively
    # Pattern: { "Authorization": `Bearer ${token}` }
    # Let's ensure the key is always double-quoted and the value is a template literal
    content = re.sub(r'["\'`](Authorization)["\'`]\s*:\s*["\'`]([^"\'`]*?\$\{.*?\}["\'`])', r'"\1": `\2', content)
    # Actually, let's keep it simple:
    content = content.replace("'Authorization':", '"Authorization":')
    content = content.replace("`Authorization`:", '"Authorization":')
    content = content.replace('`Authorization":', '"Authorization":')
    content = content.replace('"Authorization`:', '"Authorization":')
    
    # 3. Use backticks for ANY URL that contains ${
    content = re.sub(r'fetch\((["\'`].*?\$\{.*?\}.*?["\'`])', lambda m: f'fetch(`{m.group(1)[1:-1]}`', content)

    return content

app_dir = "crowd_monitoring/app"
for root, dirs, files in os.walk(app_dir):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                old_content = f.read()
            
            new_content = fix_content(old_content)
            
            if old_content != new_content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {path}")
