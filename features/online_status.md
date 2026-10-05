# Online status (online_status)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `ONLINE_STATUS`

## Notes

Shows online status of players. Key online_status (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `online_status`
- `ONLINE_STATUS`
- `Online status`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 11680–11725)

```asm
   32480  push_const                 [2735] num 111.0
   32485  push_const                 [2736] num 110.0
   32490  push_const                 [2737] num 108.0
   32495  push_const                 [2738] num 105.0
   32500  push_const                 [2739] num 110.0
   32505  push_const                 [2740] num 101.0
   32510  push_const                 [2741] num 95.0
   32515  push_const                 [2742] num 115.0
   32520  push_const                 [2743] num 116.0
   32525  push_const                 [2744] num 97.0
   32530  push_const                 [2745] num 116.0
   32535  push_const                 [2746] num 117.0
   32540  push_const                 [2747] num 115.0
   32545  put_loc                    2658
   32548  put_loc                    2659
   32551  put_loc                    2660
   32554  put_loc                    2661
   32557  put_loc                    2662
   32560  put_loc                    2663
   32563  put_loc                    2664
   32566  put_loc                    2665
   32569  put_loc                    2666
   32572  put_loc                    2667
   32575  put_loc                    2668
   32578  put_loc                    2669
   32581  put_loc                    2670
   32584  swap                       
   32585  get_loc                    2670
   32588  get_loc                    2669
   32591  get_loc                    2668
   32594  get_loc                    2667
   32597  get_loc                    2666
   32600  get_loc                    2665
   32603  get_loc                    2664
   32606  get_loc                    2663
   32609  get_loc                    2662
   32612  get_loc                    2661
   32615  get_loc                    2660
   32618  get_loc                    2659
   32621  get_loc                    2658
   32624  call_method                13
   32627  insert3                    
   32628  put_array_el               
   32629  drop                       
   32630  get_loc_check              965
   32633  push_const                 [2748] num 0.0
```

