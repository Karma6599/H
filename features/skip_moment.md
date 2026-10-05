# Skip highlight (skip_moment)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `SKIP_MOMENT`

## Notes

Skips "highlight moment" cinematics. Key skip_moment (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `skip_moment`
- `SKIP_MOMENT`
- `Skip highlight`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 10909–10954)

```asm
   30158  push_const                 [2609] num 115.0
   30163  push_const                 [2610] num 107.0
   30168  push_const                 [2611] num 105.0
   30173  push_const                 [2612] num 112.0
   30178  push_const                 [2613] num 95.0
   30183  push_const                 [2614] num 109.0
   30188  push_const                 [2615] num 111.0
   30193  push_const                 [2616] num 109.0
   30198  push_const                 [2617] num 101.0
   30203  push_const                 [2618] num 110.0
   30208  push_const                 [2619] num 116.0
   30213  put_loc                    2561
   30216  put_loc                    2562
   30219  put_loc                    2563
   30222  put_loc                    2564
   30225  put_loc                    2565
   30228  put_loc                    2566
   30231  put_loc                    2567
   30234  put_loc                    2568
   30237  put_loc                    2569
   30240  put_loc                    2570
   30243  put_loc                    2571
   30246  swap                       
   30247  get_loc                    2571
   30250  get_loc                    2570
   30253  get_loc                    2569
   30256  get_loc                    2568
   30259  get_loc                    2567
   30262  get_loc                    2566
   30265  get_loc                    2565
   30268  get_loc                    2564
   30271  get_loc                    2563
   30274  get_loc                    2562
   30277  get_loc                    2561
   30280  call_method                11
   30283  insert3                    
   30284  put_array_el               
   30285  drop                       
   30286  get_loc_check              965
   30289  push_const                 [2620] num 0.0
   30294  get_array_el               
   30295  push_const                 [2621] num 2.0
   30300  get_array_el               
   30301  get_loc_check              762
   30304  get_loc_check              629
   30307  get_loc_check              762
```

