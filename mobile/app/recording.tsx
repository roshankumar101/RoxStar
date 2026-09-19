import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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
  useEffect(() => {
    if (!recording) return undefined;
    const startedAt = Date.now() - elapsedMs;
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), 250);
    return () => clearInterval(timer);
  }, [recording, elapsedMs]);
  const displayElapsed = recording ? elapsed : elapsedMs;
  const isStopped = !recording && displayElapsed > 0;
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
              ? "Ready to save"
              : "Tap the microphone to begin"
        }
        onBack={leave}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.center}>
        <Text style={styles.timer}>{formatDuration(displayElapsed)}</Text>
        <Text style={[styles.state, recording && styles.recording]}>
          {recording ? "Recording" : isStopped ? "Recording complete" : "Ready"}
        </Text>
        <Pressable
          accessibilityLabel={recording ? "Stop recording" : "Start recording"}
          onPress={
            recording
              ? () => void stop(elapsed)
              : () => {
                  setElapsed(0);
                  void start();
                }
          }
          style={({ pressed }) => [
            styles.recordButton,
            recording && styles.recordingButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons
            name={recording ? "stop" : "mic"}
            size={42}
            color="#FFFFFF"
          />
        </Pressable>
        {isStopped && recordingUri ? (
          <Text selectable style={styles.filePath}>
            Saved locally: {recordingUri}
          </Text>
        ) : null}
        <Text style={styles.note}>
          Recording is saved locally as a WAV file on Android.
        </Text>
      </View>
      <View style={styles.actions}>
        {isStopped ? (
          <>
            <Text style={styles.inputLabel}>Draft name</Text>
            <TextInput
              accessibilityLabel="Draft name"
              maxLength={160}
              onChangeText={(value) => {
                setDraftName(value);
                if (nameError && value.trim()) setNameError("");
              }}
              onSubmitEditing={() => void save()}
              returnKeyType="done"
              selectTextOnFocus
              style={[styles.input, nameError ? styles.inputError : null]}
              value={draftName}
            />
            {nameError ? <Text style={styles.nameError}>{nameError}</Text> : null}
            <SecondaryButton label="Save draft" onPress={() => void save()} />
          </>
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
          {recording ? (
            <View style={styles.actionHalf}>
              <SecondaryButton
                label="Stop"
                icon="stop"
                onPress={() => void stop(elapsed)}
              />
            </View>
          ) : null}
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
  recording: { color: Palette.accent },
  recordButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Palette.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 36,
  },
  recordingButton: { backgroundColor: Palette.text },
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
