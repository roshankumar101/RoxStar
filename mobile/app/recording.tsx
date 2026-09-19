import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Screen,
  ScreenHeader,
  SecondaryButton,
  formatDuration,
} from "@/components/roxstar-ui";
import { Palette } from "@/constants/theme";
import { useStudioStore } from "@/stores/studio";

function defaultDraftName(): string {
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
  return `Recording ${date}`;
}

export default function RecordingScreen() {
  const router = useRouter();
  const recording = useStudioStore((state) => state.recording);
  const recordingBusy = useStudioStore((state) => state.recordingBusy);
  const recordingCompleted = useStudioStore(
    (state) => state.recordingCompleted,
  );
  const recordingMode = useStudioStore((state) => state.recordingMode);
  const recordingStartedAt = useStudioStore(
    (state) => state.recordingStartedAt,
  );
  const elapsedMs = useStudioStore((state) => state.elapsedMs);
  const start = useStudioStore((state) => state.start);
  const stop = useStudioStore((state) => state.stop);
  const cancel = useStudioStore((state) => state.cancel);
  const saveDraft = useStudioStore((state) => state.saveDraft);
  const recordingUri = useStudioStore((state) => state.recordingUri);
  const error = useStudioStore((state) => state.error);
  const [elapsed, setElapsed] = useState(elapsedMs);
  const [draftName, setDraftName] = useState(defaultDraftName);
  const [nameError, setNameError] = useState("");
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!recording || recordingStartedAt === null) {
      setElapsed(elapsedMs);
      return undefined;
    }
    const updateElapsed = () => setElapsed(Date.now() - recordingStartedAt);
    updateElapsed();
    const timer = setInterval(updateElapsed, 250);
    return () => clearInterval(timer);
  }, [elapsedMs, recording, recordingStartedAt]);

  useEffect(() => {
    if (!recording) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return undefined;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
      pulse.setValue(0);
    };
  }, [pulse, recording]);

  const displayElapsed = recording ? elapsed : elapsedMs;
  const isStopped = !recording && recordingCompleted;
  const stopRecording = () => {
    const duration =
      recordingStartedAt === null
        ? elapsed
        : Date.now() - recordingStartedAt;
    void stop(duration);
  };
  const leave = () => {
    if (recording) {
      void cancel();
    }
    router.back();
  };
  const save = async () => {
    const name = draftName.trim();
    if (!name) {
      setNameError("Enter a name for this draft.");
      return;
    }
    setNameError("");
    if (await saveDraft(name, "original")) {
      router.back();
    }
  };
  return (
    <Screen scroll={false}>
      <ScreenHeader
        title="New Draft"
        subtitle={
          recording
            ? "Recording"
            : isStopped
              ? recordingUri
                ? "Ready to save"
                : "Duration captured"
              : "Tap the microphone to begin"
        }
        onBack={leave}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.nameField}>
        <Text style={styles.inputLabel}>Draft name</Text>
        <TextInput
          accessibilityLabel="Draft name"
          editable={!recordingBusy}
          maxLength={160}
          onChangeText={(value) => {
            setDraftName(value);
            if (nameError && value.trim()) setNameError("");
          }}
          onSubmitEditing={isStopped ? () => void save() : undefined}
          returnKeyType={isStopped ? "done" : "next"}
          selectTextOnFocus
          style={[styles.input, nameError ? styles.inputError : null]}
          value={draftName}
        />
        {nameError ? <Text style={styles.nameError}>{nameError}</Text> : null}
      </View>
      <View style={styles.center}>
        <Text style={styles.timer}>{formatDuration(displayElapsed)}</Text>
        <Text style={[styles.state, recording && styles.recording]}>
          {recording
            ? "Recording..."
            : recordingBusy
              ? "Starting..."
              : isStopped
                ? "Recording complete"
                : "Ready"}
        </Text>
        {!isStopped ? (
          <View style={styles.recordControl}>
            {recording ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.recordingPulse,
                  {
                    opacity: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 0],
                    }),
                    transform: [
                      {
                        scale: pulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.28],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ) : null}
            <Pressable
              accessibilityLabel={
                recording ? "Stop recording" : "Start recording"
              }
              accessibilityRole="button"
              disabled={recordingBusy}
              onPress={
                recording
                  ? stopRecording
                  : () => {
                      setElapsed(0);
                      void start();
                    }
              }
              style={({ pressed }) => [
                styles.recordButton,
                recording && styles.recordingButton,
                recordingBusy && styles.disabled,
                pressed && !recordingBusy && styles.pressed,
              ]}
            >
              <MaterialIcons
                name={recording ? "stop" : "mic"}
                size={42}
                color="#FFFFFF"
              />
            </Pressable>
            <Text style={styles.recordAction}>
              {recording
                ? recordingBusy
                  ? "Stopping..."
                  : "Stop Recording"
                : recordingBusy
                  ? "Starting..."
                  : "Start Recording"}
            </Text>
          </View>
        ) : null}
        {isStopped && recordingUri ? (
          <Text selectable style={styles.filePath}>
            Saved locally: {recordingUri}
          </Text>
        ) : null}
        <Text style={styles.note}>
          {recordingMode === "native"
            ? "Recording is saved locally as a WAV file on Android."
            : "This preview saves the draft name, duration, and effects without an audio file."}
        </Text>
      </View>
      <View style={styles.actions}>
        {isStopped ? (
          <SecondaryButton label="Save draft" onPress={() => void save()} />
        ) : null}
        <View style={styles.actionRow}>
          <View style={styles.actionHalf}>
            <SecondaryButton
              label="Cancel"
              onPress={() => {
                void cancel();
                router.back();
              }}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  timer: {
    color: Palette.text,
    fontSize: 48,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  state: { color: Palette.muted, fontSize: 15, marginTop: 8 },
  recording: { color: Palette.danger },
  recordControl: {
    width: 180,
    minHeight: 156,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 28,
  },
  recordingPulse: {
    position: "absolute",
    top: 0,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Palette.danger,
  },
  recordButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingButton: { backgroundColor: Palette.danger },
  recordAction: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 14,
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.78 },
  filePath: {
    color: Palette.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 24,
    textAlign: "center",
  },
  note: {
    color: Palette.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 250,
    marginTop: 26,
  },
  error: {
    color: Palette.danger,
    fontSize: 13,
    marginBottom: 8,
    textAlign: "center",
  },
  nameField: { gap: 8 },
  actions: { gap: 10 },
  inputLabel: { color: Palette.text, fontSize: 13, fontWeight: "700" },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: Palette.text,
    backgroundColor: Palette.surface,
    fontSize: 16,
  },
  inputError: { borderColor: Palette.danger },
  nameError: { color: Palette.danger, fontSize: 13 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionHalf: { flex: 1 },
});
