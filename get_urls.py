import re
with open('C:/Users/dhyan/.gemini/antigravity/brain/f59ac872-31cf-421e-b305-e47cd878a9d3/.system_generated/steps/262/content.md', 'r', encoding='utf-8') as f:
    text = f.read()
    urls = re.findall(r'https://github\.com/[^\s\"\'>]+', text)
    unique_urls = set(urls)
    for u in unique_urls:
        if 'releases/download' in u:
            print(u)
