# Super held (super_hold)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `SUPER_HOLD`

## Notes

Auto-holds the Super when charged (fires when appropriate). Key super_hold (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `super_hold`
- `SUPER_HOLD`
- `Super held`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 11866–11911)

```asm
   33062  push_const                 [2783] num 115.0
   33067  push_const                 [2784] num 117.0
   33072  push_const                 [2785] num 112.0
   33077  push_const                 [2786] num 101.0
   33082  push_const                 [2787] num 114.0
   33087  push_const                 [2788] num 95.0
   33092  push_const                 [2789] num 104.0
   33097  push_const                 [2790] num 111.0
   33102  push_const                 [2791] num 108.0
   33107  push_const                 [2792] num 100.0
   33112  put_loc                    2697
   33115  put_loc                    2698
   33118  put_loc                    2699
   33121  put_loc                    2700
   33124  put_loc                    2701
   33127  put_loc                    2702
   33130  put_loc                    2703
   33133  put_loc                    2704
   33136  put_loc                    2705
   33139  put_loc                    2706
   33142  swap                       
   33143  get_loc                    2706
   33146  get_loc                    2705
   33149  get_loc                    2704
   33152  get_loc                    2703
   33155  get_loc                    2702
   33158  get_loc                    2701
   33161  get_loc                    2700
   33164  get_loc                    2699
   33167  get_loc                    2698
   33170  get_loc                    2697
   33173  call_method                10
   33176  insert3                    
   33177  put_array_el               
   33178  drop                       
   33179  get_loc_check              965
   33182  push_const                 [2793] num 0.0
   33187  get_array_el               
   33188  push_const                 [2794] num 2.0
   33193  get_array_el               
   33194  get_loc_check              674
   33197  get_loc_check              629
   33200  get_loc_check              674
   33203  get_array_el               
   33204  insert3                    
   33205  put_array_el               
```

