#pragma once

#include <algorithm>
#include <cstdint>
#include <vector>

// Delay-line echo. Delay buffer is allocated when the stream opens, never in the callback.
class EchoEffect {
public:
    void prepare(int32_t sampleRate, int32_t channelCount) {
        sampleRate_ = sampleRate;
        channelCount_ = channelCount;
        const int32_t delaySamples = static_cast<int32_t>(0.22 * sampleRate_) * channelCount_;
        delayLine_.assign(static_cast<size_t>(std::max(delaySamples, channelCount_)), 0.0f);
        writePos_ = 0;
        enabled_ = true;
    }

    void setEnabled(bool enabled) { enabled_ = enabled; }
    bool enabled() const { return enabled_; }

    void process(float *samples, int32_t numFrames) {
        if (!enabled_ || delayLine_.empty()) {
            return;
        }
        const int32_t numSamples = numFrames * channelCount_;
        const size_t delaySize = delayLine_.size();
        for (int32_t i = 0; i < numSamples; ++i) {
            const float delayed = delayLine_[writePos_];
            const float input = samples[i];
            samples[i] = input + delayed * 0.45f;
            delayLine_[writePos_] = input + delayed * 0.35f;
            writePos_ = (writePos_ + 1) % delaySize;
        }
    }

    void reset() {
        std::fill(delayLine_.begin(), delayLine_.end(), 0.0f);
        writePos_ = 0;
    }

private:
    std::vector<float> delayLine_;
    int32_t sampleRate_ = 48000;
    int32_t channelCount_ = 1;
    size_t writePos_ = 0;
    bool enabled_ = true;
};
