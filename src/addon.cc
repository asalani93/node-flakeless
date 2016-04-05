#include <nan.h>
#include "flakeless.h"

void InitAll(v8::Local<v8::Object> exports) {
  Flakeless::Init(exports);
}

NODE_MODULE(flakeless, InitAll)
