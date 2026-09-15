cmake_minimum_required(VERSION 3.22.1)
project(roxstar-native-audio)

# Sources are compiled from the Expo Android module CMakeLists.
# This file documents the engine layout for the assessment.
add_library(roxstar-native-audio INTERFACE)
target_include_directories(roxstar-native-audio INTERFACE include)
