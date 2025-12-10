import Foundation
import AVFoundation

@objc(NativeAudioSession)
class NativeAudioSession: NSObject {
  
  @objc
  func getRoute(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let session = AVAudioSession.sharedInstance()
    let route = session.currentRoute
    
    // Check outputs
    for output in route.outputs {
      if output.portType == .builtInSpeaker {
        resolve("speaker")
        return
      } else if output.portType == .builtInReceiver {
        resolve("earpiece")
        return
      } else if output.portType == .headphones || output.portType == .headsetMic {
        resolve("wired")
        return
      } else if output.portType == .bluetoothA2DP || output.portType == .bluetoothLE || output.portType == .bluetoothHFP {
        resolve("bluetooth")
        return
      }
    }
    
    resolve("unknown")
  }

  @objc
  func setRoute(_ route: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let session = AVAudioSession.sharedInstance()
    do {
      if route == "speaker" {
        try session.overrideOutputAudioPort(.speaker)
      } else {
        try session.overrideOutputAudioPort(.none)
      }
      resolve(nil)
    } catch {
      reject("ERR_AUDIO_SESSION", "Failed to set audio route", error)
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
