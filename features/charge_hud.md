# Super / Hyper state (charge_hud)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `CHARGE_HUD`

## Notes

Super / Hypercharge state HUD. Key charge_hud (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `charge_hud`
- `CHARGE_HUD`
- `Super / Hyper state`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 11168–11213)

```asm
   30975  push_const                 [2676] num 99.0
   30980  push_const                 [2677] num 104.0
   30985  push_const                 [2678] num 97.0
   30990  push_const                 [2679] num 114.0
   30995  push_const                 [2680] num 103.0
   31000  push_const                 [2681] num 101.0
   31005  push_const                 [2682] num 95.0
   31010  push_const                 [2683] num 104.0
   31015  push_const                 [2684] num 117.0
   31020  push_const                 [2685] num 100.0
   31025  put_loc                    2612
   31028  put_loc                    2613
   31031  put_loc                    2614
   31034  put_loc                    2615
   31037  put_loc                    2616
   31040  put_loc                    2617
   31043  put_loc                    2618
   31046  put_loc                    2619
   31049  put_loc                    2620
   31052  put_loc                    2621
   31055  swap                       
   31056  get_loc                    2621
   31059  get_loc                    2620
   31062  get_loc                    2619
   31065  get_loc                    2618
   31068  get_loc                    2617
   31071  get_loc                    2616
   31074  get_loc                    2615
   31077  get_loc                    2614
   31080  get_loc                    2613
   31083  get_loc                    2612
   31086  call_method                10
   31089  define_array_el            
   31090  drop                       
   31091  define_array_el            
   31092  drop                       
   31093  push_const                 [2686] str '2'
   31098  array_from                 0
   31101  put_loc                    2622
   31104  get_loc                    2622
   31107  dup                        
   31108  push_const                 [2687] num 2.0
   31113  put_field                  @stock[catch]
   31118  push_const                 [2688] str '0'
   31123  get_loc_check              1081
   31126  define_array_el            
```

