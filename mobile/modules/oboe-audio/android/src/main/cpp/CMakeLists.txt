cmake_minimum_required(VERSION 3.22.1)

project(oboe-audio)

if(NOT NATIVE_AUDIO_DIR)
    set(NATIVE_AUDIO_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../../native-audio)
endif()

add_library(oboe-audio SHARED
    jni-bridge.cpp
    ${NATIVE_AUDIO_DIR}/src/AudioEngine.cpp
)

target_include_directories(oboe-audio PRIVATE
    ${NATIVE_AUDIO_DIR}/include
)

find_package(oboe REQUIRED CONFIG)

target_link_libraries(oboe-audio
    log
    oboe::oboe
)
