import os
import glob
import re

log_dir = r"C:\Users\aravi\.gemini\antigravity\brain\5b133f47-7a56-4bf1-933f-14088cb67ab1\.system_generated\logs"
html_target = r"c:\Users\aravi\Final-Hiero\hiero-prototype\jss\hiero\hiero-last\public\coming-soon.html"

all_files = glob.glob(os.path.join(log_dir, "**", "*.txt"), recursive=True)
all_files.sort(key=os.path.getmtime, reverse=True)

html_content = ""
for f in all_files:
    try:
        with open(f, "r", encoding="utf-8") as file:
            content = file.read()
            matches = re.findall(r"(<!DOCTYPE html>.*?</html>)", content, re.DOTALL)
            if matches:
                html_content = matches[-1] # Get the very latest one
                break
    except Exception as e:
        pass

if html_content:
    with open(html_target, "w", encoding="utf-8") as out:
        out.write(html_content)
    print("Successfully wrote HTML to " + html_target)
else:
    print("Could not find HTML in logs")
