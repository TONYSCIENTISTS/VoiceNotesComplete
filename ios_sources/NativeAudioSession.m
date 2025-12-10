#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NativeAudioSession, NSObject)

RCT_EXTERN_METHOD(getRoute:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setRoute:(NSString *)route
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
