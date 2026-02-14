import os
import re

files = [
    "client/components/pages/settings-automation.tsx",
    "client/components/pages/settings-cleaning.tsx",
    "client/components/pages/settings-maintenance.tsx",
    "client/components/pages/settings-reminders.tsx",
    "client/components/pages/dev-portal.tsx",
    "client/components/pages/channels.tsx",
    "client/components/pages/chat.tsx",
    "client/components/pages/community-questions.tsx",
    "client/components/pages/inbox.tsx",
    "client/components/pages/listing-detail.tsx",
    "client/components/pages/notifications.tsx",
    "client/components/pages/profile.tsx",
    "client/components/pages/provider-portal.tsx",
    "client/components/pages/support-chat.tsx",
    "client/components/pages/admin/admin-user-detail.tsx",
    "client/components/pages/admin/admin-users.tsx",
    "client/components/channel-icon.tsx"
]

base_path = "/home/zack-river/Documents/Hoster/"

for file_rel in files:
    file_path = os.path.join(base_path, file_rel)
    if not os.path.exists(file_path):
        print(f"Skipping {file_rel} (not found)")
        continue

    print(f"Processing {file_rel}...")
    with open(file_path, "r") as f:
        content = f.read()

    # Replace import
    # import { Link, useLocation } from "wouter";
    # import { useLocation } from "wouter";
    # import { Link } from "wouter";

    new_imports = []
    if "from \"wouter\"" in content:
        if "Link" in content:
            new_imports.append("import Link from \"next/link\";")
        if "useLocation" in content or "useRouter" not in content: # Avoid double import if I manually added it (unlikely)
            new_imports.append("import { useRouter } from \"next/navigation\";")
            # Maybe usePathname too if location used for path check
            if "location.startsWith" in content or "location ===" in content:
                 new_imports[-1] = "import { useRouter, usePathname } from \"next/navigation\";"
    
        # Regex to remove wouter line
        content = re.sub(r'import\s+.*?from\s+"wouter";\n?', "", content)
        
        # Insert new imports after last import
        last_import_idx = 0
        for m in re.finditer(r'^import ', content, re.MULTILINE):
            last_import_idx = m.end()
        # Find end of that line
        next_newline = content.find('\n', last_import_idx)
        
        # Just prepend to the file imports if simpler, or try to insert nicely.
        # Let's insert after the last import line we found (checking the whole block is hard).
        # Easier: Put it at the top or replace the wouter import position?
        # Since I removed wouter import with blank, I can mistakenly leave a gap.
        # But wait, I removed it. I should replaced it.
        
        # Let's re-read and use replace
        if "from \"wouter\"" not in open(file_path).read():
             # Wouter was already removed?
             pass
        else:
             with open(file_path, "r") as f:
                 content = f.read()
             
             import_replacement = "\n".join(new_imports)
             content = re.sub(r'import\s+.*?from\s+"wouter";', import_replacement, content)

    # Replace hooks
    # const [location, setLocation] = useLocation();
    # const [, setLocation] = useLocation();
    
    if "useLocation" in content:
         # Check if we need pathname
         needs_pathname = "location" in content and ("location." in content or "location =" in content or "location =" not in content) 
         # Wait, if `[location]` is destructured, we need pathname. If `[, setLocation]`, we don't.
         
         if re.search(r'const\s+\[\s*([\w]+)\s*,\s*setLocation\s*\]\s*=\s*useLocation\(\);', content):
             # const [location, setLocation] = useLocation();
             # -> const router = useRouter(); const location = usePathname(); const setLocation = (path: string) => router.push(path);
             # But variable names match?
             content = re.sub(
                 r'const\s+\[\s*([\w]+)\s*,\s*setLocation\s*\]\s*=\s*useLocation\(\);',
                 r'const router = useRouter();\n  const \1 = usePathname();\n  const setLocation = (path: string) => router.push(path);', 
                 content
             )
         elif re.search(r'const\s+\[\s*,\s*setLocation\s*\]\s*=\s*useLocation\(\);', content):
             # const [, setLocation] = useLocation();
             # -> const router = useRouter(); const setLocation = (path: string) => router.push(path);
             content = re.sub(
                 r'const\s+\[\s*,\s*setLocation\s*\]\s*=\s*useLocation\(\);',
                 r'const router = useRouter();\n  const setLocation = (path: string) => router.push(path);',
                 content
             )
             
    # Replace Link usage?
    # Wouter: <Link href="..."> or <Link to="...">.
    # Next: <Link href="...">.
    # Wouter Link accepts 'to'. Next Link accepts 'href'.
    # If 'to=' is used, replace with 'href='.
    content = re.sub(r'<Link\s+to=', '<Link href=', content)
    
    # Also Check if Link text needs <a> tag? Next 13+ Link doesn't need <a> child. Wouter doesn't either.
    # But Next Link requires `href`.
    
    # write back
    with open(file_path, "w") as f:
        f.write(content)

print("Migration script completed.")
