import os
import re

def fix_content(content):
    # 1. Fix method quotes (find ANY method with backtick starting and double quote ending)
    content = re.sub(r'method:\s*`([A-Z]+)"', r'method: "\1"', content)
    content = re.sub(r'method:\s*([A-Z]+)`', r'method: "\1"', content)
    
    # 2. Fix Authorization quotes (ensure consistent double quotes for keys)
    content = content.replace("'Authorization':", '"Authorization":')
    content = content.replace("`Authorization`:", '"Authorization":')
    content = content.replace("`Authorization\":", '"Authorization":')
    content = content.replace("\"Authorization`:", '"Authorization":')
    
    # 3. Fix fetch URLs (ensure backticks for template literals)
    # Search for fetch calls using ${...}
    def fix_fetch_url(match):
        url_part = match.group(1)
        # Convert any starting/ending " or ' to `
        if url_part.startswith('"') or url_part.startswith("'"):
            url_part = "`" + url_part[1:]
        if url_part.endswith('"') or url_part.endswith("'"):
            url_part = url_part[:-1] + "`"
        return f'fetch({url_part}'

    content = re.sub(r'fetch\((["\'`].*?\$\{.*?\}.*?["\'`])', fix_fetch_url, content)

    # 4. Fix specific broken pattern from logs: `Authorization": `
    content = content.replace('`Authorization": `', '"Authorization": `')

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
