# Gadget cooldown (gadget_timer)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `GADGET_TIMER`

## Notes

Shows gadget cooldown timer. Key gadget_timer (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `gadget_timer`
- `GADGET_TIMER`
- `Gadget cooldown`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 11110–11155)

```asm
   30785  push_const                 [2659] num 103.0
   30790  push_const                 [2660] num 97.0
   30795  push_const                 [2661] num 100.0
   30800  push_const                 [2662] num 103.0
   30805  push_const                 [2663] num 101.0
   30810  push_const                 [2664] num 116.0
   30815  push_const                 [2665] num 95.0
   30820  push_const                 [2666] num 116.0
   30825  push_const                 [2667] num 105.0
   30830  push_const                 [2668] num 109.0
   30835  push_const                 [2669] num 101.0
   30840  push_const                 [2670] num 114.0
   30845  put_loc                    2599
   30848  put_loc                    2600
   30851  put_loc                    2601
   30854  put_loc                    2602
   30857  put_loc                    2603
   30860  put_loc                    2604
   30863  put_loc                    2605
   30866  put_loc                    2606
   30869  put_loc                    2607
   30872  put_loc                    2608
   30875  put_loc                    2609
   30878  put_loc                    2610
   30881  swap                       
   30882  get_loc                    2610
   30885  get_loc                    2609
   30888  get_loc                    2608
   30891  get_loc                    2607
   30894  get_loc                    2606
   30897  get_loc                    2605
   30900  get_loc                    2604
   30903  get_loc                    2603
   30906  get_loc                    2602
   30909  get_loc                    2601
   30912  get_loc                    2600
   30915  get_loc                    2599
   30918  call_method                12
   30921  define_array_el            
   30922  drop                       
   30923  define_array_el            
   30924  drop                       
   30925  push_const                 [2671] str '1'
   30930  array_from                 0
   30933  put_loc                    2611
   30936  get_loc                    2611
```

