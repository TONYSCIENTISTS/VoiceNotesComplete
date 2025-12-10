import Foundation
import AVFoundation

@objc(NativeLevelMeter)
class NativeLevelMeter: RCTEventEmitter {
  
  private var recorder: AVAudioRecorder?
  private var timer: Timer?
  private var isListening = false
  
  override func supportedEvents() -> [String]! {
    return ["onLevelChange"]
  }
  
  @objc
  func start() {
    if isListening { return }
    
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
      try session.setActive(true)
      
      let url = URL(fileURLWithPath: "/dev/null")
      let settings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatAppleLossless),
        AVSampleRateKey: 44100.0,
        AVNumberOfChannelsKey: 1,
        AVEncoderAudioQualityKey: AVAudioQuality.min.rawValue
      ]
      
      recorder = try AVAudioRecorder(url: url, settings: settings)
      recorder?.isMeteringEnabled = true
      recorder?.prepareToRecord()
      recorder?.record()
      
      isListening = true
      
      DispatchQueue.main.async {
        self.timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
          self?.recorder?.updateMeters()
          if let power = self?.recorder?.averagePower(forChannel: 0) {
            // Power is -160 to 0 dB
            // Normalize to 0-1
            let minDb: Float = -80.0
             let level = (max(minDb, power) - minDb) / abs(minDb)
            // Or use pow(10, power/20) for linear scale
            
            self?.sendEvent(withName: "onLevelChange", body: ["level": level])
          }
        }
      }
      
    } catch {
      print("Failed to start level meter: \(error)")
    }
  }
  
  @objc
  func stop() {
    timer?.invalidate()
    timer = null
    recorder?.stop()
    recorder = null
    isListening = false
  }
  
  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
