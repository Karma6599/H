/* CModule C fragments found in function fn_1763 (cpool order) */


     #include <gum/guminterceptor.h>
     #include <glib.h>
     extern volatile int o2dfb310daa;
     extern void o4033689ee1(void);
     void o241b220c9e(void){int o71b28dc4d9=g_atomic_int_add(&o2dfb310daa,0);if(!o71b28dc4d9)g_atomic_int_add(&o2dfb310daa,1);}
     void o4251f3e3b0(GumInvocationContext *o7b14205295){if(g_atomic_int_add(&o2dfb310daa,0)){g_atomic_int_add(&o2dfb310daa,-1);o4033689ee1();}}
    

