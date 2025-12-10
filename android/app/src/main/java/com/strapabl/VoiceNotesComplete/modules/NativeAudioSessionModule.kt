package com.strapabl.VoiceNotesComplete.modules

import android.content.Context
import android.media.AudioManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NativeAudioSessionModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val audioManager: AudioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    override fun getName(): String {
        return "NativeAudioSession"
    }

    @ReactMethod
    fun getRoute(promise: Promise) {
        try {
            if (audioManager.isSpeakerphoneOn) {
                promise.resolve("speaker")
            } else if (audioManager.isWiredHeadsetOn) {
                promise.resolve("wired")
            } else if (audioManager.isBluetoothA2dpOn || audioManager.isBluetoothScoOn) {
                promise.resolve("bluetooth")
            } else {
                promise.resolve("earpiece")
            }
        } catch (e: Exception) {
            promise.reject("ERR_AUDIO_SESSION", e)
        }
    }

    @ReactMethod
    fun setRoute(route: String, promise: Promise) {
        try {
            if (route == "speaker") {
                audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                audioManager.isSpeakerphoneOn = true
            } else if (route == "earpiece") {
                audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                audioManager.isSpeakerphoneOn = false
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERR_AUDIO_SESSION", e)
        }
    }
}
