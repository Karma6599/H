# Super blink (super_hold_blink)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `SUPER_HOLD_BLINK`

## Notes

Super-blink variant of super_hold. Key super_hold_blink (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `super_hold_blink`
- `SUPER_HOLD_BLINK`
- `Super blink`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 11919–11964)

```asm
   33223  push_const                 [2796] num 115.0
   33228  push_const                 [2797] num 117.0
   33233  push_const                 [2798] num 112.0
   33238  push_const                 [2799] num 101.0
   33243  push_const                 [2800] num 114.0
   33248  push_const                 [2801] num 95.0
   33253  push_const                 [2802] num 104.0
   33258  push_const                 [2803] num 111.0
   33263  push_const                 [2804] num 108.0
   33268  push_const                 [2805] num 100.0
   33273  push_const                 [2806] num 95.0
   33278  push_const                 [2807] num 98.0
   33283  push_const                 [2808] num 108.0
   33288  push_const                 [2809] num 105.0
   33293  push_const                 [2810] num 110.0
   33298  push_const                 [2811] num 107.0
   33303  put_loc                    2707
   33306  put_loc                    2708
   33309  put_loc                    2709
   33312  put_loc                    2710
   33315  put_loc                    2711
   33318  put_loc                    2712
   33321  put_loc                    2713
   33324  put_loc                    2714
   33327  put_loc                    2715
   33330  put_loc                    2716
   33333  put_loc                    2717
   33336  put_loc                    2718
   33339  put_loc                    2719
   33342  put_loc                    2720
   33345  put_loc                    2721
   33348  put_loc                    2722
   33351  swap                       
   33352  get_loc                    2722
   33355  get_loc                    2721
   33358  get_loc                    2720
   33361  get_loc                    2719
   33364  get_loc                    2718
   33367  get_loc                    2717
   33370  get_loc                    2716
   33373  get_loc                    2715
   33376  get_loc                    2714
   33379  get_loc                    2713
   33382  get_loc                    2712
   33385  get_loc                    2711
   33388  get_loc                    2710
```

