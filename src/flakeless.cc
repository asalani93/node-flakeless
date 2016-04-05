#include <chrono>
#include <inttypes.h>
#include "flakeless.h"

using std::chrono::duration_cast;
using std::chrono::milliseconds;
using std::chrono::system_clock;

Nan::Persistent<v8::Function> Flakeless::constructor;

// The alphabet to use for hexadecimal encoding.
const char alpha16[16] = {
  '0', '1', '2', '3',
  '4', '5', '6', '7',
  '8', '9', 'A', 'B',
  'C', 'D', 'E', 'F'
};

// The alphabet to use for base 64 encoding.
// Note: this is not meant to implement *actual* base64 encoding.  Instead, it
//   just puts a 64-bit integer into an alphabet that consists of 64 characters.
// This alphabet is the default because it packs the most information into the
//   least amount of bytes while still being URL-safe.
const char alpha64[64] = {
  '-', '0', '1', '2',
  '3', '4', '5', '6',
  '7', '8', '9', 'A',
  'B', 'C', 'D', 'E',
  'F', 'G', 'H', 'I',
  'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q',
  'R', 'S', 'T', 'U',
  'V', 'W', 'X', 'Y',
  'Z', '_', 'a', 'b',
  'c', 'd', 'e', 'f',
  'g', 'h', 'i', 'j',
  'k', 'l', 'm', 'n',
  'o', 'p', 'q', 'r',
  's', 't', 'u', 'v',
  'w', 'x', 'y', 'z'
};

Flakeless::Flakeless(double epochStart, double workerID, FlakelessOutput outputType) :
  counter_(0),
  epochStart_(static_cast<std::uint64_t>(epochStart)),
  workerID_(static_cast<std::uint64_t>(workerID)),
  outputType_(outputType)
{
  lastTime_ = duration_cast<milliseconds>(
    system_clock::now().time_since_epoch()
  ).count() - epochStart_;
}

Flakeless::~Flakeless() {

}

void Flakeless::Init(v8::Local<v8::Object> exports) {
  Nan::HandleScope scope;

  // Prepare constructor template
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
  tpl->SetClassName(Nan::New("Flakeless").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  Nan::SetPrototypeMethod(tpl, "next", Next);

  constructor.Reset(tpl->GetFunction());
  exports->Set(Nan::New("Flakeless").ToLocalChecked(), tpl->GetFunction());
}

void Flakeless::New(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if (info.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    Flakeless *obj = nullptr;

    if (!info[0]->IsUndefined() && info[0]->IsObject()) {
      // We were given a (potentially partial) options argument, so extract the
      //   provided arguments and fill in missing ones with defaults.

      // Store the object as an object and not a vague local.
      v8::Local<v8::Object> opts = info[0].As<v8::Object>();

      // Unpack all of the required arguments from the parameters arguments
      auto vEpochStart = opts->Get(Nan::New("epochStart").ToLocalChecked());
      auto vWorkerID = opts->Get(Nan::New("workerID").ToLocalChecked());
      auto vOutputType = opts->Get(Nan::New("outputType").ToLocalChecked());

      // Provide defaults for the parameters not given.
      double epochStart = vEpochStart->IsNumber() ? vEpochStart->NumberValue() : 0.f;
      double workerID = vWorkerID->IsNumber() ? vWorkerID->NumberValue() : 0.f;
      FlakelessOutput outputType = FlakelessOutput::Base64;
      if (vOutputType->IsString()) {
        std::string s(*v8::String::Utf8Value(vOutputType->ToString()));
        if (s == "base10") {
          outputType = FlakelessOutput::Base10;
        } else if (s == "base16") {
          outputType = FlakelessOutput::Base16;
        } else if (s == "base64") {
          outputType = FlakelessOutput::Base64;
        } else {
          Nan::ThrowError("Invalid value for outputType");
        }
      }

      // Construct the actual object
      obj = new Flakeless(epochStart, workerID, outputType);
    } else if (!info[0]->IsUndefined() && !info[0]->IsObject()) {
      // We were given at least one argument, but it's not an object so we don't
      //   really have a use for it, so throw an error.
      Nan::ThrowTypeError("Expects an object");
      return;
    } else {
      // We weren't given anything, so just use defaults everywhere.
      obj = new Flakeless(1.f, 2.f, FlakelessOutput::Base64);
    }

    // Flakeless* obj = new Flakeless();
    obj->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
  } else {
    // Invoked as plain function `MyObject(...)`, turn into construct call.
    // const int argc = 1;
    // v8::Local<v8::Value> argv[argc] = { info[0] };
    const int argc = 1;
    v8::Local<v8::Value> argv[argc] = { info[0] };
    v8::Local<v8::Function> cons = Nan::New<v8::Function>(constructor);
    info.GetReturnValue().Set(cons->NewInstance(argc, argv));
  }
}

void Flakeless::Next(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  // Some masks used for bit twiddling at the penultimate step.
  const std::uint64_t timestampMask = 0x1ffffffffff;
  const std::uint64_t workerMask = 0x3ff;
  const std::uint64_t counterMask = 0xfff;

  // How much to shift each of the fields by.
  const int timestampShift = 22;
  const int workerShift = 12;
  const int counterShift = 0;

  // V8 and Node internal stuff
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  Flakeless* obj = ObjectWrap::Unwrap<Flakeless>(info.Holder());

  // Get the current time, minus the start of the epoch.
  std::uint64_t currTime = duration_cast<milliseconds>(
    system_clock::now().time_since_epoch()
  ).count() - obj->epochStart_;

  if (obj->lastTime_ == currTime) {
    // This is the same millisecond from the last invocation, so we need to
    //   increment the counter by one to prevent collisions.
    obj->counter_ += 1;
  } else {
    // This is a different millisecond from the last invocation, so we can reset
    //   the intra-millisecond counter back to 0.
    // Also, set the last time to the current time.
    obj->counter_ = 0;
    obj->lastTime_ = currTime;
  }

  if (obj->counter_ > counterMask) {
    // We've generated too many IDs in this millisecond, so we'll return null to
    //   let the client know that we're out.
    info.GetReturnValue().Set(v8::Null(isolate));
    return;
  }

  // Doing that bit twiddling to construct the final basiclaly-unique ID.
  std::uint64_t timestampBits = (currTime & timestampMask) << timestampShift;
  std::uint64_t workerBits = (obj->workerID_ & workerMask) << workerShift;
  std::uint64_t counterBits = (obj->counter_ & counterMask) << counterShift;
  std::uint64_t finalBits = timestampBits | workerBits | counterBits;

  // Convert the uint64_t value to a string that JS can actually use.
  if (obj->outputType_ == FlakelessOutput::Base10) {
    // Encoding the resulting 64 bit integer as a base 10 number stored in a string.
    // Leading zeros are not preserved.
    char buff[21];
    sprintf(buff, "%" PRIu64, finalBits);
    info.GetReturnValue().Set(Nan::New(buff).ToLocalChecked());
  } else if (obj->outputType_ == FlakelessOutput::Base64) {
    // Encoding the resulting 64 bit integer as a base 64 number stored in a string.
    // Leading zeros are preserved.
    const std::uint64_t base64Mask = 0x3f;
    char buff[12];
    for (int i = 10; i >= 0; --i) {
      uint slice = finalBits & base64Mask;
      finalBits >>= 6;
      buff[i] = alpha64[slice];
    }
    buff[11] = '\0';
    info.GetReturnValue().Set(Nan::New(buff).ToLocalChecked());
  } else {
    // Encoding the resulting 64 bit integer as a base 16 number stored in a string.
    // Leading zeros are preserved.
    const std::uint64_t base16Mask = 0xf;
    char buff[17];
    for (int i = 15; i >= 0; --i) {
      uint slice = finalBits & base16Mask;
      finalBits >>= 4;
      buff[i] = alpha16[slice];
    }
    buff[16] = '\0';
    info.GetReturnValue().Set(Nan::New(buff).ToLocalChecked());
  }
}
