#!/usr/bin/env python3
"""
qjs_bc.py — QuickJS bytecode parser / validator / disassembler
Built to mirror bellard/quickjs master (BC_VERSION 5) exactly.
Used to reverse JirGear's custom QuickJS bytecode (main.qbc).

Usage:
  python3 qjs_bc.py <file.qbc> [--dump out.json] [--disasm] [--max N]
"""
import sys, re, json, struct, argparse

# ---------- opcode table ----------
def parse_opcode_header(path):
    ops = []
    seen_def = False
    for line in open(path, encoding='utf-8', errors='replace'):
        line = line.strip()
        if line.startswith('DEF('):
            seen_def = True
            m = re.match(r'DEF\(\s*([A-Za-z0-9_]+)\s*,\s*(\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*([A-Za-z0-9_]+)\s*\)', line)
            if m:
                name, size, npop, npush, fmt = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4)), m.group(5)
                ops.append((name, size, npop, npush, fmt))
    return ops

def parse_atoms_header(path):
    atoms = ['<null>']  # JS_ATOM_NULL = 0
    for line in open(path, encoding='utf-8', errors='replace'):
        ls = line.strip()
        if not ls.startswith('DEF('):
            continue
        # robust: DEF(name, "string")  — string may contain escaped quotes/backticks
        m = re.match(r'DEF\(\s*([A-Za-z0-9_]+)\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)\s*$', ls)
        if m:
            name, s = m.group(1), m.group(2)
            try:
                val = s.encode().decode('unicode_escape')
            except Exception:
                val = s
        else:
            m2 = re.match(r'DEF\(\s*([A-Za-z0-9_]+)\s*,\s*(.*?)\s*\)\s*$', ls)
            if m2:
                name, val = m2.group(1), m2.group(2).strip().strip('"')
            else:
                name, val = 'UNKNOWN', ''
        atoms.append(val)
    return atoms

FMT_SIZE = {  # operand byte-size per fmt (after the 1-byte opcode)
    'none': 0, 'none_int': 0, 'none_loc': 0, 'none_arg': 0, 'none_var_ref': 0,
    'u8': 1, 'i8': 1, 'loc8': 1, 'const8': 1, 'label8': 1,
    'u16': 2, 'i16': 2, 'label16': 2, 'npop': 2, 'npop_u16': 2,
    'npopx': 0, 'loc': 4, 'arg': 4, 'var_ref': 4, 'u32': 4, 'i32': 4,
    'const': 4, 'label': 4,
    'atom': 4, 'atom_u8': 5, 'atom_u16': 6,
    'atom_label_u8': 5, 'atom_label_u16': 6, 'label_u16': 6,
}

class Op:
    __slots__ = ('idx', 'name', 'size', 'npop', 'npush', 'fmt')
    def __init__(self, idx, name, size, npop, npush, fmt):
        self.idx, self.name, self.size = idx, name, size
        self.npop, self.npush, self.fmt = npop, npush, fmt
    def __repr__(self):
        return f'Op({self.idx:#04x} {self.name} sz={self.size} fmt={self.fmt})'

class OpcodeTable:
    def __init__(self, header_path):
        self.ops = []
        for i, (name, size, npop, npush, fmt) in enumerate(parse_opcode_header(header_path)):
            self.ops.append(Op(i, name, size, npop, npush, fmt))
        self.count = len(self.ops)
        self.by_name = {op.name: op for op in self.ops}

class ReadError(Exception):
    def __init__(self, msg, pos=None):
        self.msg, self.pos = msg, pos
        super().__init__(msg)

# ---------- reader ----------
class BCReader:
    def __init__(self, data, atoms, stock_atoms, first_atom, ops: OpcodeTable):
        self.d = data
        self.p = 0
        self.end = len(data)
        self.atoms = atoms              # file atoms
        self.stock = stock_atoms
        self.first_atom = first_atom
        self.ops = ops
        self.objects = []               # object references
        self.errors = []
        self.stats = {'functions': 0, 'modules': 0, 'strings': 0, 'objects': 0,
                      'arrays': 0, 'int32': 0, 'float64': 0, 'template': 0,
                      'bigint': 0, 'date': 0, 'objvalue': 0, 'typed': 0,
                      'arraybuf': 0, 'raw_bytes': 0, 'instrs': 0}
        self.validation_errors = []
        self.max_stack_seen = 0

    def u8(self):
        if self.p + 1 > self.end: raise ReadError('EOF', self.p)
        v = self.d[self.p]; self.p += 1; return v

    def u16(self):
        if self.p + 2 > self.end: raise ReadError('EOF', self.p)
        v = self.d[self.p] | (self.d[self.p+1] << 8); self.p += 2; return v

    def u32(self):
        if self.p + 4 > self.end: raise ReadError('EOF', self.p)
        v = struct.unpack_from('<I', self.d, self.p)[0]; self.p += 4; return v

    def u64(self):
        if self.p + 8 > self.end: raise ReadError('EOF', self.p)
        v = struct.unpack_from('<Q', self.d, self.p)[0]; self.p += 8; return v

    def uleb(self):
        v = 0; s = 0
        while True:
            if self.p >= self.end: raise ReadError('EOF uleb', self.p)
            b = self.d[self.p]; self.p += 1
            v |= (b & 0x7f) << s
            if not (b & 0x80): break
            s += 7
            if s > 35: raise ReadError('uleb too long', self.p)
        return v

    def sleb(self):
        v = 0; s = 0
        while True:
            if self.p >= self.end: raise ReadError('EOF sleb', self.p)
            b = self.d[self.p]; self.p += 1
            v |= (b & 0x7f) << s
            s += 7
            if not (b & 0x80): break
            if s > 35: raise ReadError('sleb too long', self.p)
        # sign extend
        if b & 0x40:
            v -= (1 << s)
        # python ints unbounded; mask to 32-bit signed semantics
        if v >= (1 << 31): v -= (1 << 32)
        return v

    def buf(self, n):
        if self.p + n > self.end: raise ReadError(f'EOF buf({n})', self.p)
        v = self.d[self.p:self.p+n]; self.p += n; return v

    def read_string(self):
        ln = self.uleb()
        wide = ln & 1
        ln >>= 1
        raw = self.buf(ln << wide)
        if wide:
            return raw.decode('utf-16-le', 'replace')
        return raw.decode('utf-8', 'replace')

    def atom(self):
        """Returns (kind, value): kind='int' for tagged ints, 'idx' otherwise"""
        v = self.uleb()
        if v & 1:
            return ('int', v >> 1)
        idx = v >> 1
        if idx < self.first_atom:
            return ('stock', idx)
        idx -= self.first_atom
        if idx >= len(self.atoms):
            raise ReadError(f'atom index out of range {idx} >= {len(self.atoms)}', self.p)
        return ('file', idx)

    def atom_str(self):
        kind, v = self.atom()
        if kind == 'int': return f'#{v}'
        if kind == 'stock': return self.stock[v] if v < len(self.stock) else f'stock_{v}'
        return self.atoms[v]

    # ---------- object tree ----------
    def read_object(self):
        tag = self.u8()
        if tag == 1: return None                    # NULL
        if tag == 2: return ('undefined',)          # UNDEFINED
        if tag == 3: return ('bool', False)
        if tag == 4: return ('bool', True)
        if tag == 5:                                  # INT32
            self.stats['int32'] += 1
            return ('int32', self.sleb())
        if tag == 6:                                  # FLOAT64
            self.stats['float64'] += 1
            return ('float64', struct.unpack('<d', self.buf(8))[0])
        if tag == 7:                                  # STRING
            self.stats['strings'] += 1
            return ('string', self.read_string())
        if tag == 8:                                  # OBJECT
            self.stats['objects'] += 1
            self.objects.append(('obj',))
            n = self.uleb()
            props = []
            for _ in range(n):
                a = self.atom_str()
                props.append((a, self.read_object()))
            return ('object', props)
        if tag == 9:                                  # ARRAY
            self.stats['arrays'] += 1
            self.objects.append(('arr',))
            n = self.uleb()
            return ('array', [self.read_object() for _ in range(n)])
        if tag == 10:                                 # BIG_INT
            self.stats['bigint'] += 1
            n = self.uleb()  # number of 32-bit words? then bytes, then sign
            raw = self.buf(n * 4) if n else b''
            sign = self.u8()
            return ('bigint', sign, raw.hex())
        if tag == 11:                                 # TEMPLATE_OBJECT
            self.stats['template'] += 1
            self.objects.append(('tmpl',))
            n = self.uleb()
            arr = [self.read_object() for _ in range(n)]
            raw = self.read_object()
            return ('template', arr, raw)
        if tag == 12:                                 # FUNCTION_BYTECODE
            self.stats['functions'] += 1
            return self.read_function()
        if tag == 13:                                 # MODULE
            self.stats['modules'] += 1
            return self.read_module()
        if tag == 14:                                 # TYPED_ARRAY
            self.stats['typed'] += 1
            self.objects.append(('ta',))
            at = self.u8()
            ln = self.uleb()
            off = self.uleb()
            ab = self.read_object()
            return ('typed_array', at, ln, off, ab)
        if tag == 15:                                 # ARRAY_BUFFER
            self.stats['arraybuf'] += 1
            self.objects.append(('ab',))
            bl = self.uleb()
            mbl = self.uleb()
            raw = self.buf(bl)
            self.stats['raw_bytes'] += bl
            return ('array_buffer', bl, mbl, raw.hex())
        if tag == 16:                                 # SHARED_ARRAY_BUFFER
            bl = self.uleb(); mbl = self.uleb(); ptr = self.u64()
            return ('sab', bl, mbl, ptr)
        if tag == 17:                                 # DATE
            self.stats['date'] += 1
            self.objects.append(('date',))
            return ('date', self.read_object())
        if tag == 18:                                 # OBJECT_VALUE
            self.stats['objvalue'] += 1
            self.objects.append(('ov',))
            return ('object_value', self.read_object())
        if tag == 19:                                 # OBJECT_REFERENCE
            v = self.uleb()
            if v >= len(self.objects):
                raise ReadError(f'object ref {v} >= {len(self.objects)}', self.p)
            return ('ref', v)
        raise ReadError(f'invalid tag {tag}', self.p - 1)

    def read_module(self):
        name = self.atom_str()
        req = []
        n = self.uleb()
        for _ in range(n):
            mn = self.atom_str()
            attrs = self.read_object()
            req.append((mn, attrs))
        exports = []
        n = self.uleb()
        for _ in range(n):
            et = self.u8()
            if et == 0:  # local
                vi = self.uleb()
                exports.append(('local', vi))
            else:
                rmi = self.uleb()
                ln = self.atom_str()
                exports.append(('reexport', rmi, ln))
            en = self.atom_str()
            exports[-1] = exports[-1] + (en,)
        stars = []
        n = self.uleb()
        for _ in range(n):
            stars.append(self.uleb())
        imports = []
        n = self.uleb()
        for _ in range(n):
            vi = self.uleb()
            is_star = self.u8() != 0
            iname = self.atom_str()
            rmi = self.uleb()
            imports.append((vi, is_star, iname, rmi))
        has_tla = self.u8() != 0
        print(f"  [module {name!r}] req={len(req)} exports={len(exports)} stars={len(stars)} imports={len(imports)} tla={has_tla} @0x{self.p:x}")
        for x in req[:6]:
            print("    req:", x[0], '| attrs tag:', (x[1][0] if isinstance(x[1], tuple) else x[1]))
        for x in exports[:8]:
            print("    export:", x)
        for x in imports[:8]:
            print("    import:", x)
        func = self.read_object()
        return ('module', name, req, exports, stars, imports, has_tla, func)

    def read_function(self):
        f = {}
        v16 = self.u16()
        idx = 0
        def bits(n):
            nonlocal idx
            v = (v16 >> idx) & ((1 << n) - 1)
            idx += n
            return v
        f['has_prototype'] = bits(1)
        f['has_simple_parameter_list'] = bits(1)
        f['is_derived_class_constructor'] = bits(1)
        f['need_home_object'] = bits(1)
        f['func_kind'] = bits(2)
        f['new_target_allowed'] = bits(1)
        f['super_call_allowed'] = bits(1)
        f['super_allowed'] = bits(1)
        f['arguments_allowed'] = bits(1)
        f['has_debug'] = bits(1)
        f['is_direct_or_indirect_eval'] = bits(1)
        f['js_mode'] = self.u8()  # bellard master writes js_mode
        f['func_name'] = self.atom_str()
        f['arg_count'] = self.uleb()
        f['var_count'] = self.uleb()
        f['defined_arg_count'] = self.uleb()
        f['stack_size'] = self.uleb()
        f['var_ref_count'] = self.uleb()
        f['closure_var_count'] = self.uleb()
        f['cpool_count'] = self.uleb()
        f['byte_code_len'] = self.uleb()
        local_count = self.uleb()
        f['locals'] = []
        for _ in range(local_count):
            name = self.atom_str()
            scope_next = self.uleb() - 1
            var_ref_idx = self.uleb()
            v8 = self.u8()
            i2 = 0
            def bits8(n):
                nonlocal i2
                v = (v8 >> i2) & ((1 << n) - 1)
                i2 += n
                return v
            f['locals'].append({
                'name': name, 'scope_next': scope_next, 'var_ref_idx': var_ref_idx,
                'var_kind': bits8(4), 'is_const': bits8(1), 'is_lexical': bits8(1),
                'is_captured': bits8(1), 'has_scope': bits8(1)})
        f['closure_vars'] = []
        for _ in range(f['closure_var_count']):
            name = self.atom_str()
            var_idx = self.uleb()
            v16c = self.u16()
            i3 = 0
            def bits16(n):
                nonlocal i3
                v = (v16c >> i3) & ((1 << n) - 1)
                i3 += n
                return v
            f['closure_vars'].append({
                'name': name, 'var_idx': var_idx, 'closure_type': bits16(3),
                'is_const': bits16(1), 'is_lexical': bits16(1), 'var_kind': bits16(4)})
        f['bytecode'] = self.buf(f['byte_code_len'])
        f['debug'] = None
        if f['has_debug']:
            dbg = {'filename': self.atom_str()}
            p2l_len = self.uleb()
            dbg['pc2line'] = self.buf(p2l_len).hex() if p2l_len else ''
            src_len = self.uleb()
            dbg['source'] = self.buf(src_len).decode('utf-8', 'replace') if src_len else ''
            f['debug'] = dbg
        f['cpool'] = []
        try:
            for _ in range(f['cpool_count']):
                f['cpool'].append(self.read_object())
        except ReadError as e:
            print(f"  [fn {f.get('func_name')!r}] cpool fail at {e.pos}: {e.msg}")
            print(f"    args={f['arg_count']} vars={f['var_count']} defargs={f['defined_arg_count']} stack={f['stack_size']}")
            print(f"    var_ref={f['var_ref_count']} closures={f['closure_var_count']} cpool={f['cpool_count']} bclen={f['byte_code_len']} locals={len(f['locals'])}")
            print(f"    parsed {len(f['cpool'])}/{f['cpool_count']} cpool entries before failure")
            if e.pos:
                print("    ctx bytes:", self.d[e.pos-24:e.pos+24].hex())
            raise
        return ('function', f)

    # ---------- validation / disassembly ----------
    def disassemble(self, bc, fn_name=''):
        """Iterate opcode stream like JS_ReadFunctionBytecode's reloc pass.
        Returns (instrs, errors). Validates atom bounds & label targets."""
        ops = self.ops
        out = []
        errors = []
        pos = 0
        bc_len = len(bc)
        # pass 1: instruction boundaries
        boundaries = set()
        p = 0
        while p < bc_len:
            boundaries.add(p)
            op = bc[p]
            if op >= ops.count:
                errors.append(f'{fn_name}@{p}: opcode 0x{op:02x} >= OP_COUNT ({ops.count}) — CUSTOM/INVALID')
                p += 1
                continue
            p += ops.ops[op].size
        if p != bc_len:
            errors.append(f'{fn_name}: stream over-run pos {p} != len {bc_len}')
        # pass 2: decode with operand checks
        pos = 0
        while pos < bc_len:
            opb = bc[pos]
            if opb >= ops.count:
                out.append((pos, f'OPCODE_0x{opb:02x}?? (>= OP_COUNT — CUSTOM)', ''))
                pos += 1
                continue
            op = ops.ops[opb]
            args = []
            end = pos + op.size
            if end > bc_len:
                errors.append(f'{fn_name}@{pos}: truncated {op.name}')
            try:
                if op.fmt == 'atom' or op.fmt.startswith('atom_'):
                    idx = struct.unpack_from('<I', bc, pos + 1)[0]
                    kind = 'int' if idx & 1 else None
                    if kind == 'int':
                        args.append(f'#{idx >> 1}')
                    else:
                        i = idx >> 1
                        if i < self.first_atom:
                            args.append(f'stock:{self.stock[i] if i < len(self.stock) else i}')
                        else:
                            i -= self.first_atom
                            if i >= len(self.atoms):
                                errors.append(f'{fn_name}@{pos}: atom idx {i} OOB')
                                args.append(f'ATOM_OOB_{i}')
                            else:
                                args.append(f'{self.atoms[i]!r}')
                if op.fmt in ('atom_u8', 'atom_label_u8'):
                    args.append(str(bc[pos + 5]))
                if op.fmt in ('atom_u16', 'atom_label_u16'):
                    args.append(str(struct.unpack_from('<H', bc, pos + 5)[0]))
                if op.fmt in ('u8', 'loc8', 'const8', 'npopx', 'u16'):
                    if op.fmt == 'u16':
                        args.append(str(struct.unpack_from('<H', bc, pos + 1)[0]))
                    else:
                        args.append(str(bc[pos + 1]))
                elif op.fmt in ('i8',):
                    args.append(str(struct.unpack_from('<b', bc, pos + 1)[0]))
                elif op.fmt in ('loc', 'arg', 'var_ref'):
                    args.append(str(struct.unpack_from('<H', bc, pos + 1)[0]))
                elif op.fmt == 'u32':
                    args.append(str(struct.unpack_from('<I', bc, pos + 1)[0]))
                elif op.fmt in ('i32', 'const'):
                    args.append(str(struct.unpack_from('<i', bc, pos + 1)[0]))
                elif op.fmt == 'npop':
                    args.append(str(struct.unpack_from('<H', bc, pos + 1)[0]))
                elif op.fmt == 'npop_u16':
                    args.append(str(struct.unpack_from('<H', bc, pos + 1)[0]))
                elif op.fmt == 'label':
                    off = struct.unpack_from('<i', bc, pos + 1)[0]
                    tgt = pos + 1 + off  # JirGear custom: offset relative to OPERAND START
                    if tgt not in boundaries and tgt != bc_len:
                        errors.append(f'{fn_name}@{pos}: bad label target {tgt} ({op.name})')
                    args.append(f'-> {tgt}')
                elif op.fmt in ('label8', 'label16'):
                    sz = 1 if op.fmt == 'label8' else 2
                    off = (struct.unpack_from('<b', bc, pos + 1)[0] if sz == 1
                           else struct.unpack_from('<h', bc, pos + 1)[0])
                    tgt = pos + 1 + off  # JirGear custom: offset relative to OPERAND START
                    if tgt not in boundaries and tgt != bc_len:
                        errors.append(f'{fn_name}@{pos}: bad label target {tgt} ({op.name})')
                    args.append(f'-> {tgt}')
                elif op.fmt == 'label_u16':
                    off = struct.unpack_from('<i', bc, pos + 1)[0]
                    tgt = pos + 1 + off  # JirGear custom: offset relative to OPERAND START
                    if tgt not in boundaries and tgt != bc_len:
                        errors.append(f'{fn_name}@{pos}: bad label target {tgt} ({op.name})')
                    args.append(f'-> {tgt}, u16={struct.unpack_from("<H", bc, pos+5)[0]}')
                elif op.fmt == 'i16':
                    args.append(str(struct.unpack_from('<h', bc, pos + 1)[0]))
            except struct.error:
                errors.append(f'{fn_name}@{pos}: struct unpack error {op.name}')
            out.append((pos, op.name, ' '.join(args)))
            self.stats['instrs'] += 1
            pos = end
        return out, errors

def walk_functions(obj, cb, depth=0):
    if isinstance(obj, tuple) and obj and obj[0] == 'function':
        cb(obj[1])
        for c in obj[1].get('cpool', []):
            walk_functions(c, cb, depth + 1)
    elif isinstance(obj, tuple) and obj and obj[0] == 'module':
        walk_functions(obj[-1], cb, depth + 1)
    elif isinstance(obj, tuple) and obj and obj[0] in ('object',):
        for _, v in obj[1]:
            walk_functions(v, cb, depth + 1)
    elif isinstance(obj, tuple) and obj and obj[0] == 'array':
        for v in obj[1]:
            walk_functions(v, cb, depth + 1)
    elif isinstance(obj, tuple) and obj and obj[0] == 'template':
        for v in obj[1]:
            walk_functions(v, cb, depth + 1)
        walk_functions(obj[2], cb, depth + 1)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('file')
    ap.add_argument('--opcode-header', default='/home/z/my-project/work/opcodes/bellard_quickjs_master.h')
    ap.add_argument('--atom-header', default='/home/z/my-project/work/opcodes/bellard_quickjs-atom.h')
    ap.add_argument('--first-atom', type=int, default=None, help='JS_ATOM_END override')
    ap.add_argument('--dump', help='JSON structure dump')
    ap.add_argument('--disasm', action='store_true')
    ap.add_argument('--disasm-out', default=None)
    ap.add_argument('--max-errors', type=int, default=50)
    args = ap.parse_args()

    data = open(args.file, 'rb').read()
    print(f"file: {args.file} ({len(data):,} B)")

    ops = OpcodeTable(args.opcode_header)
    stock = parse_atoms_header(args.atom_header)
    print(f"opcode table: {ops.count} ops | stock atoms: {len(stock)}")

    r = BCReader(data, [], stock, 0, ops)
    # header
    ver = r.u8()
    print(f"BC_VERSION byte: {ver}")
    count = r.uleb()
    print(f"atom count: {count}")
    atoms = [r.read_string() for _ in range(count)]
    r.atoms = atoms
    first_atom = args.first_atom if args.first_atom is not None else len(stock)
    r.first_atom = first_atom
    print(f"first_atom = {first_atom} (stock bound); atoms end at 0x{r.p:x}")

    obj = r.read_object()
    print(f"\nparse OK! consumed 0x{r.p:x} / {len(data):,} bytes")
    print(f"stats: {r.stats}")

    # validate + optionally disassemble all functions
    all_errors = []
    funcs = []
    walk_functions(obj, lambda f: funcs.append(f))
    print(f"\nfunctions found: {len(funcs)}")
    lines = []
    for i, f in enumerate(funcs):
        instrs, errs = r.disassemble(f['bytecode'], f.get('func_name', f'fn{i}'))
        all_errors.extend(errs)
        if args.disasm:
            lines.append(f"\n=== func {f.get('func_name')!r} args={f['arg_count']} vars={f['var_count']} stack={f['stack_size']} bclen={f['byte_code_len']} ===")
            if f.get('locals'):
                lines.append('locals: ' + ', '.join(l['name'] for l in f['locals'][:40]))
            for off, name, a in instrs:
                lines.append(f"  {off:5d}  {name:24s} {a}")
    print(f"total validation errors: {len(all_errors)}")
    for e in all_errors[:args.max_errors]:
        print("  ERR:", e)
    # opcode histogram
    hist = {}
    for f in funcs:
        bc = f['bytecode']; p = 0
        while p < len(bc):
            op = bc[p]
            hist[op] = hist.get(op, 0) + 1
            p += ops.ops[op].size if op < ops.count else 1
    print("\nopcodes used (top 40 by freq):")
    for op, n in sorted(hist.items(), key=lambda x: -x[1])[:40]:
        name = ops.ops[op].name if op < ops.count else f'CUSTOM_0x{op:02x}'
        print(f"  0x{op:02x} {name:28s} {n:>7}")
    mx = max(hist) if hist else 0
    print(f"\nmax opcode byte seen: 0x{mx:02x} (table count = {ops.count})")
    if mx >= ops.count:
        print("  !!! opcodes beyond stock table => CUSTOM OPCODES PRESENT")
    if args.dump:
        def default(o): return None
        json.dump({'stats': r.stats, 'errors': all_errors[:1000]}, open(args.dump, 'w'), indent=1)
        print(f"dumped to {args.dump}")
    if args.disasm_out:
        open(args.disasm_out, 'w').write('\n'.join(lines))
        print(f"disassembly written to {args.disasm_out} ({len(lines):,} lines)")

if __name__ == '__main__':
    main()
