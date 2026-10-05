/* CModule C fragments found in function fn_2711 (cpool order) */

#include <gum/guminterceptor.h>
#include <glib.h>
extern void *o3be97a2117;
extern volatile int oa3101;
extern int oa3102;
extern void oa3103(void);
void oa3104(void){g_atomic_int_add(&oa3101,1);}
void o4f3f92b402(GumInvocationContext *o26c64db6af548431){o3be97a2117=gum_invocation_context_get_nth_argument(o26c64db6af548431,0);}
void oa3105(GumInvocationContext *o26c64db6af548431){int o422c367b1c9fa010=g_atomic_int_add(&oa3101,0);if(o422c367b1c9fa010!=oa3102){oa3102=o422c367b1c9fa010;oa3103();}}

