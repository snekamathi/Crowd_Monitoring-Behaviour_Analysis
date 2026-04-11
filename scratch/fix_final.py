import os

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Ensure config import
    if ("API_BASE_URL" in content or "ALERTS_API_URL" in content) and 'import { API_BASE_URL' not in content:
        if '"use client";' in content:
            content = content.replace('"use client";', '"use client";\nimport { API_BASE_URL, ALERTS_API_URL } from "@/app/config";')
        else:
            content = 'import { API_BASE_URL, ALERTS_API_URL } from "@/app/config";\n' + content

    # 2. Fix the specific broken pattern
    content = content.replace('"+API_BASE_URL+"', '${API_BASE_URL}')
    content = content.replace("'+API_BASE_URL+'", "${API_BASE_URL}")
    content = content.replace('"+ALERTS_API_URL+"', '${ALERTS_API_URL}')
    content = content.replace("'+ALERTS_API_URL+'", "${ALERTS_API_URL}")
    
    # 3. Ensure backticks if ${API_BASE_URL} is used
    # This is tricky with simple replace, but let's fix common fetch cases
    content = content.replace('fetch("${API_BASE_URL}', 'fetch(`${API_BASE_URL}')
    content = content.replace('fetch("${ALERTS_API_URL}', 'fetch(`${ALERTS_API_URL}')
    # Fix the ending quote for those fetch calls
    import re
    content = re.sub(r'fetch\(`\$\{API_BASE_URL\}([^"\']+?)["\']', r'fetch(`${API_BASE_URL}\1`', content)
    content = re.sub(r'fetch\(`\$\{ALERTS_API_URL\}([^"\']+?)["\']', r'fetch(`${ALERTS_API_URL}\1`', content)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

app_dir = "crowd_monitoring/app"
for root, dirs, files in os.walk(app_dir):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            fix_file(os.path.join(root, file))
