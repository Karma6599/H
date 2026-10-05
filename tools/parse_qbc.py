#!/usr/bin/env python3
"""Parse JirGear main.qbc — QuickJS bytecode atom table extractor."""
import sys, struct, json

def uleb128(d, p):
    v = 0; s = 0
    while True:
        b = d[p]; p += 1
        v |= (b & 0x7f) << s
        if not (b & 0x80): break
        s += 7
    return v, p

def read_atoms(path):
    d = open(path, 'rb').read()
    print(f"file: {path} ({len(d):,} bytes)")
    ver = d[0]
    print(f"BC_VERSION byte: {ver}")
    p = 1
    count, p = uleb128(d, p)
    print(f"atom count (uleb128): {count} @ offset {p}")
    atoms = []
    for i in range(count):
        ln, p = uleb128(d, p)
        wide = ln & 1
        ln >>= 1
        if wide:
            raw = d[p:p+ln*2]; p += ln*2
            try: s = raw.decode('utf-16-le')
            except: s = repr(raw)
        else:
            raw = d[p:p+ln]; p += ln
            try: s = raw.decode('utf-8', 'replace')
            except: s = repr(raw)
        atoms.append(s)
    print(f"atoms end @ offset {p} (0x{p:x})")
    return d, ver, count, atoms, p

if __name__ == '__main__':
    d, ver, count, atoms, end = read_atoms(sys.argv[1] if len(sys.argv)>1 else 'jirgear_main.qbc')
    # Stats
    print(f"\nfirst 30 atoms: {atoms[:30]}")
    print(f"last 30 atoms: {atoms[-30:]}")
    # Look for feature/module indicators
    interesting = [a for a in atoms if any(k in a.lower() for k in ['feature','menu','aim','dodge','esp','speed','hack','spam','aura','pin','camera','fps','module','core/','utils/','helpers/','ui/'])]
    print(f"\ninteresting atoms ({len(interesting)}):")
    for a in interesting[:80]: print("  ", a)
    json.dump(atoms, open('main_atoms.json','w'), ensure_ascii=False, indent=0)
    print(f"\nAll atoms saved to main_atoms.json")
