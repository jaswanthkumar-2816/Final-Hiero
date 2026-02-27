
import re

def strip_markers(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = [line for line in lines if not any(m in line for m in ['<<<<<<< HEAD', '=======', '>>>>>>> origin/main'])]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

if __name__ == '__main__':
    strip_markers('g:/pro/Final-Hiero/routes/unifiedTemplates.js')
    strip_markers('g:/pro/Final-Hiero/routes/resume.js')
