# Fetches action.yml from popular actions at a pinned commit; keeps only composite ones.
import re, urllib.request, json, sys, os
C = sys.argv[1:] or open(os.path.join(os.path.dirname(__file__), "candidates.txt")).read().split()
def get(u):
    try:
        b = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "actioncheck-corpus"}), timeout=30).read().decode()
        print(f"- GET {u} -> 200", file=sys.stderr); return b
    except Exception as e:
        print(f"- GET {u} -> {e}", file=sys.stderr); return None
manifest = {}
for spec in C:
    parts = spec.split("/"); repo = "/".join(parts[:2]); sub = "/".join(parts[2:])
    atom = get(f"https://github.com/{repo}/commits.atom")
    m = re.search(r"Grit::Commit/([0-9a-f]{40})", atom or "")
    if not m: continue
    sha = m.group(1)
    for name in ("action.yml", "action.yaml"):
        src = get(f"https://raw.githubusercontent.com/{repo}/{sha}/{sub + '/' if sub else ''}{name}")
        if src: break
    if not src: continue
    comp = bool(re.search(r"^\s*using:\s*['\"]?composite", src, re.M | re.I))
    if not comp: continue
    d = os.path.join(os.path.dirname(__file__), "actions", spec.replace("/", "__")); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, name), "w").write(src)
    manifest[spec] = {"sha": sha, "file": name, "url": f"https://github.com/{repo}/blob/{sha}/{sub + '/' if sub else ''}{name}"}
json.dump(manifest, open(os.path.join(os.path.dirname(__file__), "manifest.json"), "w"), indent=1)
print(len(manifest), "composite actions:", *manifest, sep="\n")
