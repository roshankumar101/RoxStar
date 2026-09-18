package expo.modules.oboeaudio

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.util.Log
import java.io.File
import java.util.UUID

class OboeAudioModule : Module() {
  companion object {
    private const val TAG = "RoxstarOboe"

    init {
      System.loadLibrary("oboe-audio")
    }
  }

  // Thin JNI bridge only. Capture, Echo, WAV writing, and Oboe lifecycle live in C++.
  private external fun nativeStartRecording(path: String): String
  private external fun nativeStopRecording(): String
  private external fun nativeCancelRecording(): String
  private external fun nativeSetEffect(name: String)
  private external fun nativeGetRecordingState(): String
  private external fun nativeOnLifecyclePause()

  override fun definition() = ModuleDefinition {
    Name("OboeAudio")

    OnActivityEntersBackground {
      nativeOnLifecyclePause()
    }

    AsyncFunction("startRecording") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val recordingsDirectory = File(context.filesDir, "recordings")
      if (!recordingsDirectory.exists() && !recordingsDirectory.mkdirs()) {
        throw Exception("Unable to create recordings directory")
      }
      if (!recordingsDirectory.isDirectory) {
        throw Exception("Recording path is not a directory")
      }
      val file = File(recordingsDirectory, "roxstar-${UUID.randomUUID()}.wav")
      val error = nativeStartRecording(file.absolutePath)
      if (error.isNotEmpty()) {
        throw Exception(error)
      }
      file.toURI().toString()
    }

    AsyncFunction("stopRecording") {
      val result = nativeStopRecording()
      if (result.startsWith("ERROR:")) {
        throw Exception(result.removePrefix("ERROR:"))
      }
      val file = File(result)
      if (!file.isFile || file.length() < 44L) {
        throw Exception("WAV file was not finalized: $result")
      }
      Log.i(TAG, "Final WAV verified path=${file.absolutePath} bytes=${file.length()}")
      file.toURI().toString()
    }

    AsyncFunction("cancelRecording") {
      val error = nativeCancelRecording()
      if (error.isNotEmpty()) {
        throw Exception(error)
      }
    }

    Function("setEffect") { name: String ->
      nativeSetEffect(name)
    }

    Function("getRecordingState") {
      nativeGetRecordingState()
    }
  }
}
