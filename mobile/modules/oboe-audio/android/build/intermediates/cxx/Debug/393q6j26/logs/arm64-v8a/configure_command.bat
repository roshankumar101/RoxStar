@echo off
"C:\\Users\\rosha\\AppData\\Local\\Android\\Sdk\\cmake\\3.22.1\\bin\\cmake.exe" ^
  "-HD:\\RoxStar\\mobile\\modules\\oboe-audio\\android\\src\\main\\cpp" ^
  "-DCMAKE_SYSTEM_NAME=Android" ^
  "-DCMAKE_EXPORT_COMPILE_COMMANDS=ON" ^
  "-DCMAKE_SYSTEM_VERSION=24" ^
  "-DANDROID_PLATFORM=android-24" ^
  "-DANDROID_ABI=arm64-v8a" ^
  "-DCMAKE_ANDROID_ARCH_ABI=arm64-v8a" ^
  "-DANDROID_NDK=C:\\Users\\rosha\\AppData\\Local\\Android\\Sdk\\ndk\\27.1.12297006" ^
  "-DCMAKE_ANDROID_NDK=C:\\Users\\rosha\\AppData\\Local\\Android\\Sdk\\ndk\\27.1.12297006" ^
  "-DCMAKE_TOOLCHAIN_FILE=C:\\Users\\rosha\\AppData\\Local\\Android\\Sdk\\ndk\\27.1.12297006\\build\\cmake\\android.toolchain.cmake" ^
  "-DCMAKE_MAKE_PROGRAM=C:\\Users\\rosha\\AppData\\Local\\Android\\Sdk\\cmake\\3.22.1\\bin\\ninja.exe" ^
  "-DCMAKE_CXX_FLAGS=-std=c++17 -fexceptions -frtti" ^
  "-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=D:\\RoxStar\\mobile\\modules\\oboe-audio\\android\\build\\intermediates\\cxx\\Debug\\393q6j26\\obj\\arm64-v8a" ^
  "-DCMAKE_RUNTIME_OUTPUT_DIRECTORY=D:\\RoxStar\\mobile\\modules\\oboe-audio\\android\\build\\intermediates\\cxx\\Debug\\393q6j26\\obj\\arm64-v8a" ^
  "-DCMAKE_BUILD_TYPE=Debug" ^
  "-DCMAKE_FIND_ROOT_PATH=D:\\RoxStar\\mobile\\modules\\oboe-audio\\android\\.cxx\\Debug\\393q6j26\\prefab\\arm64-v8a\\prefab" ^
  "-BD:\\RoxStar\\mobile\\modules\\oboe-audio\\android\\.cxx\\Debug\\393q6j26\\arm64-v8a" ^
  -GNinja ^
  "-DANDROID_STL=c++_shared" ^
  "-DNATIVE_AUDIO_DIR=D:/RoxStar/native-audio"
