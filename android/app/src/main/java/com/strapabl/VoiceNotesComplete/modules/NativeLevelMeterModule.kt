package com.strapabl.VoiceNotesComplete.modules

import android.media.MediaRecorder
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Timer
import java.util.TimerTask

class NativeLevelMeterModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var mediaRecorder: MediaRecorder? = null
    private var timer: Timer? = null
    private var isListening = false

    override fun getName(): String {
        return "NativeLevelMeter"
    }

    @ReactMethod
    fun start() {
        if (isListening) return

        try {
            mediaRecorder = MediaRecorder().apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setOutputFile("/dev/null") 
                prepare()
                start()
            }
            isListening = true
            startTimer()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun stop() {
        stopTimer()
        try {
            mediaRecorder?.stop()
            mediaRecorder?.reset()
            mediaRecorder?.release()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        mediaRecorder = null
        isListening = false
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    private fun startTimer() {
        timer = Timer()
        timer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                mediaRecorder?.let { mr ->
                    try {
                        val maxAmplitude = mr.maxAmplitude
                        val normalized = (maxAmplitude / 32767.0).coerceIn(0.0, 1.0)
                        sendEvent("onLevelChange", normalized)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }, 0, 100) 
    }

    private fun stopTimer() {
        timer?.cancel()
        timer = null
    }

    private fun sendEvent(eventName: String, params: Any?) {
        val payload = Arguments.createMap()
        if (params is Double) {
            payload.putDouble("level", params)
        }
        
        if (reactContext.hasActiveCatalystInstance()) {
             reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, payload)
        }
    }
}
