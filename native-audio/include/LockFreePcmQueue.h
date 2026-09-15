#pragma once

#include <algorithm>
#include <atomic>
#include <cstdint>
#include <vector>

// Single-producer (Oboe callback) / single-consumer (writer thread) float PCM queue.
// Capacity is fixed at construction; the realtime path never allocates.
class LockFreePcmQueue {
public:
    explicit LockFreePcmQueue(size_t capacitySamples)
        : buffer_(capacitySamples, 0.0f), capacity_(capacitySamples) {}

    bool push(const float *samples, int32_t count) {
        const size_t write = writeIndex_.load(std::memory_order_relaxed);
        const size_t read = readIndex_.load(std::memory_order_acquire);
        const size_t used = write - read;
        if (used + static_cast<size_t>(count) > capacity_) {
            return false;
        }
        for (int32_t i = 0; i < count; ++i) {
            buffer_[(write + static_cast<size_t>(i)) % capacity_] = samples[i];
        }
        writeIndex_.store(write + static_cast<size_t>(count), std::memory_order_release);
        return true;
    }

    int32_t pop(float *out, int32_t maxCount) {
        const size_t read = readIndex_.load(std::memory_order_relaxed);
        const size_t write = writeIndex_.load(std::memory_order_acquire);
        const size_t available = write - read;
        const int32_t count = static_cast<int32_t>(
            std::min(available, static_cast<size_t>(maxCount)));
        for (int32_t i = 0; i < count; ++i) {
            out[i] = buffer_[(read + static_cast<size_t>(i)) % capacity_];
        }
        readIndex_.store(read + static_cast<size_t>(count), std::memory_order_release);
        return count;
    }

    void reset() {
        writeIndex_.store(0, std::memory_order_relaxed);
        readIndex_.store(0, std::memory_order_relaxed);
    }

private:
    std::vector<float> buffer_;
    const size_t capacity_;
    std::atomic<size_t> writeIndex_{0};
    std::atomic<size_t> readIndex_{0};
};
