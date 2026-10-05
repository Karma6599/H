# Nani gadget (nani_gadget)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `NANI_GADGET`

## Notes

Auto-uses Nani’s gadget (the AIM GADGET row). Key nani_gadget (obfuscated). NOTE: the key/labels are never stored as plaintext strings — they are built at runtime with String.fromCharCode (anti-static-analysis).

## Key strings / constants

- `nani_gadget`
- `NANI_GADGET`
- `Nani gadget`
- `fromCharCode`

## Disassembly (entry)

### fromCharCode key construction (obfuscated registration, disasm lines 11990–12035)

```asm
   33450  push_const                 [2815] num 110.0
   33455  push_const                 [2816] num 97.0
   33460  push_const                 [2817] num 110.0
   33465  push_const                 [2818] num 105.0
   33470  push_const                 [2819] num 95.0
   33475  push_const                 [2820] num 103.0
   33480  push_const                 [2821] num 97.0
   33485  push_const                 [2822] num 100.0
   33490  push_const                 [2823] num 103.0
   33495  push_const                 [2824] num 101.0
   33500  push_const                 [2825] num 116.0
   33505  put_loc                    2723
   33508  put_loc                    2724
   33511  put_loc                    2725
   33514  put_loc                    2726
   33517  put_loc                    2727
   33520  put_loc                    2728
   33523  put_loc                    2729
   33526  put_loc                    2730
   33529  put_loc                    2731
   33532  put_loc                    2732
   33535  put_loc                    2733
   33538  swap                       
   33539  get_loc                    2733
   33542  get_loc                    2732
   33545  get_loc                    2731
   33548  get_loc                    2730
   33551  get_loc                    2729
   33554  get_loc                    2728
   33557  get_loc                    2727
   33560  get_loc                    2726
   33563  get_loc                    2725
   33566  get_loc                    2724
   33569  get_loc                    2723
   33572  call_method                11
   33575  insert3                    
   33576  put_array_el               
   33577  drop                       
   33578  get_loc_check              965
   33581  push_const                 [2826] num 0.0
   33586  get_array_el               
   33587  push_const                 [2827] num 2.0
   33592  get_array_el               
   33593  get_loc_check              2317
   33596  get_loc_check              629
   33599  get_loc_check              2317
```

