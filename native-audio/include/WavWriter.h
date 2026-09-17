#pragma once

#include <cstdint>
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>

class WavWriter
{
public:
    ~WavWriter() { close(); }

    bool open(const std::string &path, int32_t sampleRate, int32_t channelCount)
    {
        close();
        path_ = path;
        sampleRate_ = sampleRate;
        channelCount_ = channelCount;
        dataBytes_ = 0;
        file_ = std::fopen(path.c_str(), "wb");
        if (!file_)
        {
            return false;
        }
        uint8_t header[44]{};
        writeHeader(header, 0);
        if (std::fwrite(header, 1, 44, file_) != 44)
        {
            close();
            return false;
        }
        return true;
    }

    bool writeFloats(const float *samples, int32_t count)
    {
        if (!file_)
        {
            return false;
        }
        scratch_.resize(static_cast<size_t>(count));
        for (int32_t i = 0; i < count; ++i)
        {
            float s = samples[i];
            if (s > 1.0f)
                s = 1.0f;
            if (s < -1.0f)
                s = -1.0f;
            scratch_[static_cast<size_t>(i)] = static_cast<int16_t>(s * 32767.0f);
        }
        const size_t bytes = static_cast<size_t>(count) * sizeof(int16_t);
        if (std::fwrite(scratch_.data(), 1, bytes, file_) != bytes)
        {
            return false;
        }
        dataBytes_ += static_cast<uint32_t>(bytes);
        return true;
    }

    bool finalize()
    {
        if (!file_)
        {
            return false;
        }
        std::fflush(file_);
        if (std::fseek(file_, 0, SEEK_SET) != 0)
        {
            return false;
        }
        uint8_t header[44]{};
        writeHeader(header, dataBytes_);
        if (std::fwrite(header, 1, 44, file_) != 44)
        {
            return false;
        }
        close();
        return dataBytes_ > 0;
    }

    void abort()
    {
        close();
        if (!path_.empty())
        {
            std::remove(path_.c_str());
        }
        path_.clear();
        dataBytes_ = 0;
    }

    uint32_t dataBytes() const { return dataBytes_; }
    const std::string &path() const { return path_; }

private:
    void close()
    {
        if (file_)
        {
            std::fclose(file_);
            file_ = nullptr;
        }
    }

    void writeHeader(uint8_t *h, uint32_t dataBytes) const
    {
        const uint32_t byteRate = static_cast<uint32_t>(sampleRate_ * channelCount_ * 2);
        const uint16_t blockAlign = static_cast<uint16_t>(channelCount_ * 2);
        const uint32_t riffSize = 36 + dataBytes;
        std::memcpy(h + 0, "RIFF", 4);
        std::memcpy(h + 4, &riffSize, 4);
        std::memcpy(h + 8, "WAVE", 4);
        std::memcpy(h + 12, "fmt ", 4);
        const uint32_t fmtSize = 16;
        std::memcpy(h + 16, &fmtSize, 4);
        const uint16_t audioFormat = 1;
        std::memcpy(h + 20, &audioFormat, 2);
        std::memcpy(h + 22, &channelCount_, 2);
        std::memcpy(h + 24, &sampleRate_, 4);
        std::memcpy(h + 28, &byteRate, 4);
        std::memcpy(h + 32, &blockAlign, 2);
        const uint16_t bitsPerSample = 16;
        std::memcpy(h + 34, &bitsPerSample, 2);
        std::memcpy(h + 36, "data", 4);
        std::memcpy(h + 40, &dataBytes, 4);
    }

    FILE *file_ = nullptr;
    std::string path_;
    int32_t sampleRate_ = 48000;
    int32_t channelCount_ = 1;
    uint32_t dataBytes_ = 0;
    std::vector<int16_t> scratch_;
};
