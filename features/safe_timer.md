# Safe shield timer (safe_timer)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `SAFE_TIMER`

## Notes

Safe shield timer HUD. Key safe_timer (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `safe_timer`
- `SAFE_TIMER`
- `Safe shield timer`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 11220–11265)

```asm
   31143  push_const                 [2691] num 115.0
   31148  push_const                 [2692] num 97.0
   31153  push_const                 [2693] num 102.0
   31158  push_const                 [2694] num 101.0
   31163  push_const                 [2695] num 95.0
   31168  push_const                 [2696] num 116.0
   31173  push_const                 [2697] num 105.0
   31178  push_const                 [2698] num 109.0
   31183  push_const                 [2699] num 101.0
   31188  push_const                 [2700] num 114.0
   31193  put_loc                    2623
   31196  put_loc                    2624
   31199  put_loc                    2625
   31202  put_loc                    2626
   31205  put_loc                    2627
   31208  put_loc                    2628
   31211  put_loc                    2629
   31214  put_loc                    2630
   31217  put_loc                    2631
   31220  put_loc                    2632
   31223  swap                       
   31224  get_loc                    2632
   31227  get_loc                    2631
   31230  get_loc                    2630
   31233  get_loc                    2629
   31236  get_loc                    2628
   31239  get_loc                    2627
   31242  get_loc                    2626
   31245  get_loc                    2625
   31248  get_loc                    2624
   31251  get_loc                    2623
   31254  call_method                10
   31257  define_array_el            
   31258  drop                       
   31259  define_array_el            
   31260  drop                       
   31261  close_loc                  2476
   31264  close_loc                  2477
   31267  dup                        
   31268  get_var                    12
   31271  get_field                  #125
   31276  get_array_el               
   31277  call_method                0
   31280  put_loc                    2633
   31283  get_loc                    2633
   31286  typeof                     
```

