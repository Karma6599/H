/* CModule C fragments found in function fn_1008 (cpool order) */

#include <gum/guminterceptor.h>
struct o244c9e476d { long o8e29743cb9; long o6dd5e74358; };
extern int o6f3695f7d1(int o708e73046c, struct o244c9e476d *o77100c0405);
typedef struct {volatile guint of074cfb8d1,occ57680e37,oe37fa64d15,o5f56032e74;gpointer o0dafbe1727,obc39df6c84,of6da7d1b16;guint64 oa8e9f4d3d5,o02ca0e0e03,o252c58d3b1;} o1c0c367116;
extern o1c0c367116 o1dc8f45ab1;
typedef struct {guint oe37fa64d15;gpointer o0dafbe1727,obc39df6c84,of6da7d1b16;} oe5b9d1af25;
static guint64 o570726e992(void){struct o244c9e476d o1bbcaf4de2;if(o6f3695f7d1(1,&o1bbcaf4de2)!=0)return 0;return (guint64)o1bbcaf4de2.o8e29743cb9*1000+(guint64)o1bbcaf4de2.o6dd5e74358/1000000;}
static gboolean oc195c754c1(gpointer o0dafbe1727,gpointer obc39df6c84){volatile guint8 *of5261dce24=(volatile guint8*)o0dafbe1727,*oa229fadebd=(volatile guint8*)obc39df6c84;return of5261dce24[3961]&&of5261dce24[3853]&&!oa229fadebd[700]&&(((guint)oa229fadebd[1292]|((guint)oa229fadebd[1293]<<1))==o1dc8f45ab1.o5f56032e74)&&*(volatile gint*)(oa229fadebd+196)>0;}
void o3c990ab9f2(void){o1c0c367116 *of5261dce24=&o1dc8f45ab1;of5261dce24->of074cfb8d1=0;++of5261dce24->oe37fa64d15;}
void oc41f5fa9f1(guint od3339191bf){o1dc8f45ab1.occ57680e37=od3339191bf;}
void o12175fd815(gpointer o0dafbe1727,gpointer obc39df6c84,gpointer of6da7d1b16,gint o4fa69d8a59,gint ob9e7ebed36){o1c0c367116 *of5261dce24=&o1dc8f45ab1;guint64 o62ff06c17f=o570726e992();of5261dce24->of074cfb8d1=0;++of5261dce24->oe37fa64d15;of5261dce24->o0dafbe1727=o0dafbe1727;of5261dce24->obc39df6c84=obc39df6c84;of5261dce24->of6da7d1b16=of6da7d1b16;of5261dce24->o5f56032e74=((guint)((guint8*)obc39df6c84)[1292]|((guint)((guint8*)obc39df6c84)[1293]<<1));of5261dce24->oa8e9f4d3d5=((guint64)(guint32)ob9e7ebed36<<32)|(guint32)o4fa69d8a59;of5261dce24->o02ca0e0e03=o62ff06c17f?o62ff06c17f+160:0;of5261dce24->of074cfb8d1=of5261dce24->o02ca0e0e03!=0;}
guint64 ocfdf78dd4b(void){return o1dc8f45ab1.o252c58d3b1;}
void o7886b51c7a(GumInvocationContext *o4d24ec1062){o1c0c367116 *of5261dce24=&o1dc8f45ab1;oe5b9d1af25 *o9460edc2b6=GUM_IC_GET_INVOCATION_DATA(o4d24ec1062,oe5b9d1af25);gpointer o0dafbe1727,obc39df6c84,of6da7d1b16;o9460edc2b6->o0dafbe1727=NULL;if(!of5261dce24->of074cfb8d1||of5261dce24->occ57680e37)return;o0dafbe1727=gum_invocation_context_get_nth_argument(o4d24ec1062,0);obc39df6c84=gum_invocation_context_get_nth_argument(o4d24ec1062,1);of6da7d1b16=gum_invocation_context_get_nth_argument(o4d24ec1062,2);if(o0dafbe1727!=of5261dce24->o0dafbe1727||obc39df6c84!=of5261dce24->obc39df6c84||of6da7d1b16!=of5261dce24->of6da7d1b16||!oc195c754c1(o0dafbe1727,obc39df6c84))return;o9460edc2b6->oe37fa64d15=of5261dce24->oe37fa64d15;o9460edc2b6->o0dafbe1727=o0dafbe1727;o9460edc2b6->obc39df6c84=obc39df6c84;o9460edc2b6->of6da7d1b16=of6da7d1b16;}
void of56b9a4146(GumInvocationContext *o4d24ec1062){o1c0c367116 *of5261dce24=&o1dc8f45ab1;oe5b9d1af25 *o9460edc2b6=GUM_IC_GET_INVOCATION_DATA(o4d24ec1062,oe5b9d1af25);guint64 o62ff06c17f;if(!o9460edc2b6->o0dafbe1727||!of5261dce24->of074cfb8d1||of5261dce24->occ57680e37||o9460edc2b6->oe37fa64d15!=of5261dce24->oe37fa64d15||o9460edc2b6->o0dafbe1727!=of5261dce24->o0dafbe1727||o9460edc2b6->obc39df6c84!=of5261dce24->obc39df6c84||o9460edc2b6->of6da7d1b16!=of5261dce24->of6da7d1b16)return;o62ff06c17f=o570726e992();if(!o62ff06c17f||o62ff06c17f>of5261dce24->o02ca0e0e03||!oc195c754c1(o9460edc2b6->o0dafbe1727,o9460edc2b6->obc39df6c84))return;gum_invocation_context_replace_return_value(o4d24ec1062,(gpointer)(gsize)of5261dce24->oa8e9f4d3d5);++of5261dce24->o252c58d3b1;}


