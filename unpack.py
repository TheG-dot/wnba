import os
import json

transcript_path = r"C:\Users\dhyan\.gemini\antigravity\brain\f59ac872-31cf-421e-b305-e47cd878a9d3\.system_generated\logs\transcript_full.jsonl"
if not os.path.exists(transcript_path):
    transcript_path = transcript_path.replace("transcript_full.jsonl", "transcript.jsonl")

# Find the last USER_INPUT that contains the lovable dump
content = ""
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT' and 'FILE: package.json' in data.get('content', ''):
                content = data['content']
        except:
            pass

if not content:
    print("Could not find the lovable dump in the transcript.")
    exit(1)

# Parse the content
parts = content.split("====================================================================================================\nFILE: ")

# First part is intro text, so we skip it (index 0)
for part in parts[1:]:
    lines = part.split("\n", 2)
    if len(lines) < 3:
        continue
    filename = lines[0].strip()
    # lines[1] is the closing ========
    filecontent = lines[2]
    
    # Clean up the trailing ==== if it exists
    if "====================================================================================================" in filecontent:
        filecontent = filecontent.split("====================================================================================================")[0]
    
    filepath = os.path.join("frontend", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8') as out:
        out.write(filecontent)
        
    print(f"Wrote {filepath}")

print("Done unpacking.")
