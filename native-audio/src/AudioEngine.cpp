#include "AudioEngine.h"

#include <android/log.h>

#include <chrono>

#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "RoxstarOboe", __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "RoxstarOboe", __VA_ARGS__)

AudioEngine &AudioEngine::instance()
{
    static AudioEngine engine;
    return engine;
}

AudioEngine::AudioEngine() = default;

AudioEngine::~AudioEngine()
{
    std::lock_guard<std::mutex> lock(mutex_);
    recording_.store(false);
    stopWriterThread();
    closeStream();
}

std::string AudioEngine::startRecording(const std::string &filePath)
{
    std::lock_guard<std::mutex> lock(mutex_);
    if (recording_.load() || stream_)
    {
        return "already_recording";
    }
    if (filePath.empty())
    {
        return "invalid_file_path";
    }
    filePath_ = filePath;
    finalizedPath_.clear();
    streamFailed_.store(false);

    const oboe::Result openResult = openStream();
    if (openResult != oboe::Result::OK)
    {
        return std::string("oboe_open_failed:") + oboe::convertToText(openResult);
    }

    actualSampleRate_ = stream_->getSampleRate();
    echo_.prepare(actualSampleRate_, stream_->getChannelCount());
    echo_.setEnabled(effectName_ == "echo");
    echo_.reset();

    const size_t queueSamples = static_cast<size_t>(actualSampleRate_ * 4);
    queue_ = std::make_unique<LockFreePcmQueue>(queueSamples);
    writerScratch_.assign(4096, 0.0f);

    if (!wavWriter_.open(filePath_, actualSampleRate_, stream_->getChannelCount()))
    {
        LOGE("Unable to open WAV file path=%s", filePath_.c_str());
        closeStream();
        return "file_write_failed";
    }
    LOGI("WAV file opened path=%s", filePath_.c_str());

    startWriterThread();
    recording_.store(true);

    const oboe::Result startResult = stream_->requestStart();
    if (startResult != oboe::Result::OK)
    {
        recording_.store(false);
        stopWriterThread();
        wavWriter_.abort();
        closeStream();
        return std::string("oboe_start_failed:") + oboe::convertToText(startResult);
    }

    LOGI("Recording started path=%s rate=%d channels=%d",
         filePath_.c_str(),
         actualSampleRate_,
         stream_->getChannelCount());
    return "";
}

std::string AudioEngine::stopRecording(std::string &outPath)
{
    std::lock_guard<std::mutex> lock(mutex_);
    if (!recording_.load() && !stream_)
    {
        if (!finalizedPath_.empty())
        {
            outPath = finalizedPath_;
            return "";
        }
        return "invalid_stream_state";
    }
    LOGI("Recording stop requested");
    recording_.store(false);
    closeStream();
    stopWriterThread();

    const uint32_t dataBytes = wavWriter_.dataBytes();
    if (!wavWriter_.finalize())
    {
        wavWriter_.abort();
        return dataBytes == 0 ? "empty_recording" : "wav_finalize_failed";
    }
    outPath = filePath_;
    finalizedPath_ = outPath;
    if (streamFailed_.load())
    {
        LOGE("Oboe stream ended with an error; finalized captured PCM");
    }
    LOGI("Pending PCM flushed and WAV finalized path=%s bytes=%u", outPath.c_str(), dataBytes);
    LOGI("WAV file flushed and closed path=%s", outPath.c_str());
    LOGI("Recording stopped path=%s bytes=%u", outPath.c_str(), wavWriter_.dataBytes());
    return "";
}

std::string AudioEngine::cancelRecording()
{
    std::lock_guard<std::mutex> lock(mutex_);
    recording_.store(false);
    closeStream();
    stopWriterThread();
    wavWriter_.abort();
    filePath_.clear();
    finalizedPath_.clear();
    LOGI("Recording cancelled and incomplete WAV removed");
    return "";
}

void AudioEngine::setEffect(const std::string &name)
{
    std::lock_guard<std::mutex> lock(mutex_);
    effectName_ = name;
    echo_.setEnabled(name == "echo");
}

std::string AudioEngine::getRecordingState() const
{
    if (recording_.load())
    {
        return "recording";
    }
    return "idle";
}

void AudioEngine::onLifecyclePause()
{
    if (recording_.load())
    {
        std::string finalizedPath;
        const std::string error = stopRecording(finalizedPath);
        if (!error.empty())
        {
            LOGE("Unable to finalize recording on lifecycle pause: %s", error.c_str());
        }
    }
}

oboe::Result AudioEngine::openStream()
{
    oboe::AudioStreamBuilder builder;
    builder.setDirection(oboe::Direction::Input)
        ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
        ->setSharingMode(oboe::SharingMode::Exclusive)
        ->setFormat(kFormat)
        ->setFormatConversionAllowed(true)
        ->setChannelCount(kChannelCount)
        ->setSampleRate(kRequestedSampleRate)
        ->setSampleRateConversionQuality(oboe::SampleRateConversionQuality::Medium)
        ->setDataCallback(this)
        ->setErrorCallback(this)
        ->setInputPreset(oboe::InputPreset::VoiceRecognition);

    return builder.openStream(stream_);
}

void AudioEngine::closeStream()
{
    if (stream_)
    {
        stream_->stop();
        stream_->close();
        stream_.reset();
    }
}

void AudioEngine::startWriterThread()
{
    writerRunning_.store(true);
    writerThread_ = std::thread([this]
                                { writerLoop(); });
}

void AudioEngine::stopWriterThread()
{
    writerRunning_.store(false);
    writerCv_.notify_all();
    if (writerThread_.joinable())
    {
        writerThread_.join();
    }
}

void AudioEngine::writerLoop()
{
    while (true)
    {
        int32_t popped = 0;
        if (queue_)
        {
            popped = queue_->pop(writerScratch_.data(), static_cast<int32_t>(writerScratch_.size()));
        }
        if (popped > 0)
        {
            if (!wavWriter_.writeFloats(writerScratch_.data(), popped))
            {
                LOGE("WAV write failed");
                streamFailed_.store(true);
                break;
            }
            continue;
        }
        if (!writerRunning_.load())
        {
            break;
        }
        std::unique_lock<std::mutex> lock(writerMutex_);
        writerCv_.wait_for(lock, std::chrono::milliseconds(20));
    }
}

oboe::DataCallbackResult AudioEngine::onAudioReady(oboe::AudioStream *stream,
                                                   void *audioData,
                                                   int32_t numFrames)
{
    if (!recording_.load())
    {
        return oboe::DataCallbackResult::Stop;
    }
    auto *samples = static_cast<float *>(audioData);
    echo_.process(samples, numFrames);
    const int32_t count = numFrames * stream->getChannelCount();
    if (queue_ && !queue_->push(samples, count))
    {
        LOGI("PCM queue overrun; dropping frames");
    }
    writerCv_.notify_one();
    return oboe::DataCallbackResult::Continue;
}

void AudioEngine::onErrorAfterClose(oboe::AudioStream * /*stream*/, oboe::Result error)
{
    LOGE("Oboe stream error after close: %s", oboe::convertToText(error));
    streamFailed_.store(true);
    recording_.store(false);
}
