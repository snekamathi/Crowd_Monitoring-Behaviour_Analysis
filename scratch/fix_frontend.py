import os

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add import if missing
    if "API_BASE_URL" in content or "ALERTS_API_URL" in content:
        if "from \"@/app/config\"" not in content:
            content = content.replace('"use client";', '"use client";\nimport { API_BASE_URL, ALERTS_API_URL } from "@/app/config";')
    
    # Fix ' + VAR + ' patterns to `${VAR}`
    content = content.replace("''+API_BASE_URL+''", "${API_BASE_URL}")
    content = content.replace("' + API_BASE_URL + '", "${API_BASE_URL}")
    content = content.replace("''+ALERTS_API_URL+''", "${ALERTS_API_URL}")
    content = content.replace("' + ALERTS_API_URL + '", "${ALERTS_API_URL}")
    
    # Fix "'+API_BASE_URL+'" patterns
    content = content.replace("\"'+API_BASE_URL+'\"", "`${API_BASE_URL}`")
    content = content.replace("\"'+ALERTS_API_URL+'\"", "`${ALERTS_API_URL}`")
    
    # Fix direct '+VAR+' patterns that might be inside template literals already
    # But be careful not to double up. 
    # Let's just do a safer general replace for the specific broken pattern I see in logs
    content = content.replace("''+API_BASE_URL+'", "${API_BASE_URL}")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

app_dir = "crowd_monitoring/app"
for root, dirs, files in os.walk(app_dir):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            fix_file(os.path.join(root, file))
