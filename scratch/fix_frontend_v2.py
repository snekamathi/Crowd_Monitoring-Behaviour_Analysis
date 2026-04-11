import os
import re

def fix_content(content):
    # First, handle the broken patterns I created earlier
    # Pattern: fetch(''+API_BASE_URL+'/api/...) 
    # or fetch("'+API_BASE_URL+'"/api/...)
    
    # 1. Add import if missing and needed
    if ("API_BASE_URL" in content or "ALERTS_API_URL" in content) and "from \"@/app/config\"" not in content:
        content = content.replace('"use client";', '"use client";\nimport { API_BASE_URL, ALERTS_API_URL } from "@/app/config";')

    # 2. Aggressive regex replacement to clean up ANY mixed quote/placeholder mess
    # Matches: ' + API_BASE_URL + '/  OR  "+API_BASE_URL+"/  OR  `${API_BASE_URL}/  etc.
    # We want to normalize all of these to `${API_BASE_URL}
    
    # Replace the specific broken fetch pattern: fetch(''+API_BASE_URL+'/
    content = re.sub(r"fetch\(['\"]{0,2}\+API_BASE_URL\+\(?['\"]{0,2}/", r"fetch(`${API_BASE_URL}/", content)
    content = re.sub(r"fetch\(['\"]{0,2}\+ALERTS_API_URL\+\(?['\"]{0,2}/", r"fetch(`${ALERTS_API_URL}/", content)
    
    # Replace other occurrences like: src={`'+API_BASE_URL+'/view...`}
    content = re.sub(r"['\"](?:\+API_BASE_URL\+|\+ALERTS_API_URL\+)['\"]/", r"`", content)
    
    # Fix the ones my previous script broke (missing backtick)
    # fetch(${API_BASE_URL}/api/...
    content = re.sub(r"fetch\(\$\{API_BASE_URL\}", r"fetch(`${API_BASE_URL}", content)
    content = re.sub(r"fetch\(\$\{ALERTS_API_URL\}", r"fetch(`${ALERTS_API_URL}", content)
    
    # Fix ending quotes for those: .../stats', { -> .../stats`, {
    content = re.sub(r"(\$\{API_BASE_URL\}[^`'\"]+)['\"][\s]*,", r"\1`,", content)
    content = re.sub(r"(\$\{ALERTS_API_URL\}[^`'\"]+)['\"][\s]*,", r"\1`,", content)

    # Specific fix for common src pattern: src={`${API_BASE_URL}/api/video_feed?token=${localStorage.getItem('access_token')}`}
    # Ensure it's not double-wrapped
    
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

print("Fix completed.")
