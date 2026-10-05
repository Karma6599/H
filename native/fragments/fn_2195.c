/* CModule C fragments found in function fn_2195 (cpool order) */


 typedef unsigned long long o5f875436fee7b660;
 int o75e24b8a(void *o66ffa41b43501b22){
  if(!o66ffa41b43501b22)return -1;void *o591423cb5e551e1d=*(void **)((char *)o66ffa41b43501b22+360);if(!o591423cb5e551e1d)return -1;
  o5f875436fee7b660 o72e3a53126a1e6bd=*(o5f875436fee7b660 *)((char *)o591423cb5e551e1d+24);if(o72e3a53126a1e6bd>512)return -1;
  void *odb30a8c54a062579=*(void **)((char *)o591423cb5e551e1d+16);o5f875436fee7b660 oef67fd0cc63bdbb3=0;int o6c5ea3cbf7fe9165=0;
  while(odb30a8c54a062579&&oef67fd0cc63bdbb3<o72e3a53126a1e6bd){int *o2cf702278a9baf4b=*(int **)((char *)odb30a8c54a062579+24);if(o2cf702278a9baf4b){if(*o2cf702278a9baf4b<0||*o2cf702278a9baf4b>1000000)return -1;o6c5ea3cbf7fe9165+=*o2cf702278a9baf4b;if(o6c5ea3cbf7fe9165>10000000)return -1;}odb30a8c54a062579=*(void **)odb30a8c54a062579;oef67fd0cc63bdbb3++;}
  return odb30a8c54a062579||oef67fd0cc63bdbb3!=o72e3a53126a1e6bd?-1:o6c5ea3cbf7fe9165;
 }
 

