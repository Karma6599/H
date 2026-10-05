/* CModule C fragments found in function fn_684 (cpool order) */


        #define o6db3d7681c 256
        typedef struct {volatile int o71ff27da2e;unsigned oae197f56ff;unsigned of5d123fd8f;unsigned ob6504c7271;double o4a8f454348;} o6ea33753fc;
        typedef struct {
          volatile int o74857398e3;volatile int oabfae9a74b;volatile int o346520c8e8;volatile int o3784d31f76;
          volatile int o4213185b35;volatile int of5d123fd8f;unsigned o8b8590d725;volatile int oc71782979c;
          unsigned oc8b3feabf6;unsigned ob6504c7271;double o6998b341d1;o6ea33753fc o980ce08c3b[o6db3d7681c];
        } o7eb40241c6;
        extern unsigned char o57e4274b0e[];
        #define o0e55a855cd ((o7eb40241c6 *)o57e4274b0e)
        #if ofd3c546c8d
        typedef struct {long obfc73f890c;long oac6c447dc3;} o5c6441786a;
        extern int o38c1eed792(int of018d45b91,o5c6441786a *ocae8dadbb7);
        #endif
        double o571db0b8da(void){
          #if ofd3c546c8d
          o5c6441786a o532cbcd782;
          if(o38c1eed792(1,&o532cbcd782)!=0)return 0.0;
          return (double)o532cbcd782.obfc73f890c*1000.0+(double)o532cbcd782.oac6c447dc3/1000000.0;
          #else
          return 0.0;
          #endif
        }
        void o2f51000df4(GumInvocationContext *oe1d4c7af32){
          unsigned of5d123fd8f,oc71782979c,o8c3886ff56;double oa48c63a9e3,o4446c220cd;o6ea33753fc *oa17bb19084;
          if(!o0e55a855cd->o74857398e3||(int)oe1d4c7af32->cpu_context->x[0]!=1)return;
          g_atomic_int_add(&o0e55a855cd->oabfae9a74b,1);
          if(!o0e55a855cd->o346520c8e8||!ofd3c546c8d)return;
          if(g_atomic_int_add(&o0e55a855cd->o3784d31f76,1)!=0){g_atomic_int_add(&o0e55a855cd->oc71782979c,1);g_atomic_int_add(&o0e55a855cd->o3784d31f76,-1);return;}
          of5d123fd8f=(unsigned)g_atomic_int_add(&o0e55a855cd->of5d123fd8f,0);oc71782979c=(unsigned)g_atomic_int_add(&o0e55a855cd->oc71782979c,0);
          oa48c63a9e3=o571db0b8da();
          if(o0e55a855cd->o8b8590d725!=of5d123fd8f||o0e55a855cd->oc8b3feabf6!=oc71782979c){o0e55a855cd->o8b8590d725=of5d123fd8f;o0e55a855cd->oc8b3feabf6=oc71782979c;o0e55a855cd->o6998b341d1=0.0;}
          o4446c220cd=oa48c63a9e3-o0e55a855cd->o6998b341d1;
          if(o0e55a855cd->o6998b341d1>0.0&&oa48c63a9e3>0.0&&o4446c220cd>0.0&&oc71782979c==(unsigned)g_atomic_int_add(&o0e55a855cd->oc71782979c,0)){
            o8c3886ff56=(unsigned)g_atomic_int_add(&o0e55a855cd->o4213185b35,0)+1;
            oa17bb19084=&o0e55a855cd->o980ce08c3b[(o8c3886ff56-1)&(o6db3d7681c-1)];
            g_atomic_int_add(&oa17bb19084->o71ff27da2e,1);
            oa17bb19084->oae197f56ff=o8c3886ff56;oa17bb19084->of5d123fd8f=of5d123fd8f;oa17bb19084->o4a8f454348=o4446c220cd;
            g_atomic_int_add(&oa17bb19084->o71ff27da2e,1);
            g_atomic_int_add(&o0e55a855cd->o4213185b35,1);
          }
          o0e55a855cd->o6998b341d1=oa48c63a9e3>0.0?oa48c63a9e3:0.0;
          g_atomic_int_add(&o0e55a855cd->o3784d31f76,-1);
        }
        void ob8203babeb(int o909103dbec){int o8c1e60643d=g_atomic_int_add(&o0e55a855cd->o74857398e3,0);if(o8c1e60643d!=o909103dbec)g_atomic_int_add(&o0e55a855cd->o74857398e3,o909103dbec-o8c1e60643d);}
        void o92d7770fe0(int o909103dbec){int o8c1e60643d=g_atomic_int_add(&o0e55a855cd->o346520c8e8,0);if(o8c1e60643d!=o909103dbec){g_atomic_int_add(&o0e55a855cd->of5d123fd8f,1);g_atomic_int_add(&o0e55a855cd->o346520c8e8,o909103dbec-o8c1e60643d);}}
        unsigned oabfae9a74b(void){return(unsigned)g_atomic_int_add(&o0e55a855cd->oabfae9a74b,0);}
        unsigned oae197f56ff(void){return(unsigned)g_atomic_int_add(&o0e55a855cd->o4213185b35,0);}
        unsigned of5d123fd8f(void){return(unsigned)g_atomic_int_add(&o0e55a855cd->of5d123fd8f,0);}
      

