@echo off
"C:\\Program Files\\Microsoft\\jdk-17.0.18.8-hotspot\\bin\\java" ^
  --class-path ^
  "C:\\Users\\rosha\\.gradle\\caches\\modules-2\\files-2.1\\com.google.prefab\\cli\\2.1.0\\aa32fec809c44fa531f01dcfb739b5b3304d3050\\cli-2.1.0-all.jar" ^
  com.google.prefab.cli.AppKt ^
  --build-system ^
  cmake ^
  --platform ^
  android ^
  --abi ^
  x86 ^
  --os-version ^
  24 ^
  --stl ^
  c++_shared ^
  --ndk-version ^
  27 ^
  --output ^
  "C:\\Users\\rosha\\AppData\\Local\\Temp\\agp-prefab-staging13433976613835601945\\staged-cli-output" ^
  "C:\\Users\\rosha\\.gradle\\caches\\9.3.1\\transforms\\2cd81c268779897f9290f429231ea61c\\workspace\\transformed\\oboe-1.9.3\\prefab"
