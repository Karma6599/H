# Hide Super aim (hide_super_aim)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `HIDE_SUPER_AIM`

## Notes

Hides the super aim indicator. Key hide_super_aim (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `hide_super_aim`
- `HIDE_SUPER_AIM`
- `Hide Super aim`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 11615–11660)

```asm
   32275  push_const                 [2718] num 104.0
   32280  push_const                 [2719] num 105.0
   32285  push_const                 [2720] num 100.0
   32290  push_const                 [2721] num 101.0
   32295  push_const                 [2722] num 95.0
   32300  push_const                 [2723] num 115.0
   32305  push_const                 [2724] num 117.0
   32310  push_const                 [2725] num 112.0
   32315  push_const                 [2726] num 101.0
   32320  push_const                 [2727] num 114.0
   32325  push_const                 [2728] num 95.0
   32330  push_const                 [2729] num 97.0
   32335  push_const                 [2730] num 105.0
   32340  push_const                 [2731] num 109.0
   32345  put_loc                    2644
   32348  put_loc                    2645
   32351  put_loc                    2646
   32354  put_loc                    2647
   32357  put_loc                    2648
   32360  put_loc                    2649
   32363  put_loc                    2650
   32366  put_loc                    2651
   32369  put_loc                    2652
   32372  put_loc                    2653
   32375  put_loc                    2654
   32378  put_loc                    2655
   32381  put_loc                    2656
   32384  put_loc                    2657
   32387  swap                       
   32388  get_loc                    2657
   32391  get_loc                    2656
   32394  get_loc                    2655
   32397  get_loc                    2654
   32400  get_loc                    2653
   32403  get_loc                    2652
   32406  get_loc                    2651
   32409  get_loc                    2650
   32412  get_loc                    2649
   32415  get_loc                    2648
   32418  get_loc                    2647
   32421  get_loc                    2646
   32424  get_loc                    2645
   32427  get_loc                    2644
   32430  call_method                14
   32433  insert3                    
   32434  put_array_el               
```

