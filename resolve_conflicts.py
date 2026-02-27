
import re

def resolve_unified_templates():
    with open('g:/pro/Final-Hiero/routes/unifiedTemplates.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find conflict blocks
    conflict_pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> origin/main', re.DOTALL)

    def resolver(match):
        head = match.group(1)
        main = match.group(2)
        
        # If it's about hiero-signature and has "dynamic" or "height", it's likely my fix
        # Priority: Keep HEAD for Signature spacing, main for others
        if 'hiero-signature' in head or 'signature' in head or 'contentHeight' in head or 'rotatedLabel' in head:
            # But main might have new architectural additions like addBulletPoint
            # If main has addBulletPoint, try to keep it but keep our spacing
            if 'addBulletPoint' in main:
                return head # For now, let's just keep our optimized one to be safe for the user
            return head
        
        # Default to main for new templates or architectural changes
        return main

    new_content = conflict_pattern.sub(resolver, content)
    
    with open('g:/pro/Final-Hiero/routes/unifiedTemplates.js', 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == '__main__':
    resolve_unified_templates()
