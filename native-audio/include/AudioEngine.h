#pragma once

#include "EchoEffect.h"
#include "LockFreePcmQueue.h"
#include "WavWriter.h"

#include <oboe/Oboe.h>

#include <atomic>
#include <condition_variable>
#include <memory>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

class AudioEngine : public oboe::AudioStreamDataCallback,
                    public oboe::AudioStreamErrorCallback
{
public:
    static AudioEngine &instance();

    std::string startRecording(const std::string &filePath);
    std::string stopRecording(std::string &outPath);
    std::string cancelRecording();
    void setEffect(const std::string &name);
    std::string getRecordingState() const;
    void onLifecyclePause();

    oboe::DataCallbackResult onAudioReady(oboe::AudioStream *stream,
                                          void *audioData,
                                          int32_t numFrames) override;
    void onErrorAfterClose(oboe::AudioStream *stream, oboe::Result error) override;

    static constexpr int32_t kRequestedSampleRate = 48000;
    static constexpr int32_t kChannelCount = 1;
    static constexpr oboe::AudioFormat kFormat = oboe::AudioFormat::Float;

private:
    AudioEngine();
    ~AudioEngine();
    AudioEngine(const AudioEngine &) = delete;
    AudioEngine &operator=(const AudioEngine &) = delete;

    oboe::Result openStream();
    void closeStream();
    void startWriterThread();
    void stopWriterThread();
    void writerLoop();

    std::mutex mutex_;
    std::shared_ptr<oboe::AudioStream> stream_;
    EchoEffect echo_;
    std::unique_ptr<LockFreePcmQueue> queue_;
    WavWriter wavWriter_;
    std::thread writerThread_;
    std::mutex writerMutex_;
    std::condition_variable writerCv_;
    std::vector<float> writerScratch_;
    std::atomic<bool> writerRunning_{false};
    std::atomic<bool> recording_{false};
    std::atomic<bool> streamFailed_{false};
    std::string filePath_;
    std::string effectName_{"echo"};
    int32_t actualSampleRate_ = kRequestedSampleRate;
};
