import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  PrimaryButton,
  Screen,
  ScreenHeader,
  SecondaryButton,
  formatDuration,
} from "@/components/roxstar-ui";
import { Palette } from "@/constants/theme";
import { useStudioStore } from "@/stores/studio";

export default function RecordingScreen() {
  const router = useRouter();
  const recording = useStudioStore((state) => state.recording);
  const elapsedMs = useStudioStore((state) => state.elapsedMs);
  const start = useStudioStore((state) => state.start);
  const stop = useStudioStore((state) => state.stop);
  const cancel = useStudioStore((state) => state.cancel);
  const saveDraft = useStudioStore((state) => state.saveDraft);
  const [elapsed, setElapsed] = useState(elapsedMs);
  const [name, setName] = useState("");
  useEffect(() => {
    if (!recording) return undefined;
    const startedAt = Date.now() - elapsedMs;
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), 250);
    return () => clearInterval(timer);
  }, [recording, elapsedMs]);
  const displayElapsed = recording ? elapsed : elapsedMs;
  const isStopped = !recording && displayElapsed > 0;
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
        onBack={() => {
          void cancel();
          router.back();
        }}
      />
      <View style={styles.center}>
        <Text style={styles.timer}>{formatDuration(displayElapsed)}</Text>
        <Text style={[styles.state, recording && styles.recording]}>
          {recording ? "Recording" : isStopped ? "Recording complete" : "Ready"}
        </Text>
        <Pressable
          accessibilityLabel={recording ? "Stop recording" : "Start recording"}
          onPress={recording ? () => void stop(elapsed) : () => void start()}
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
        {isStopped ? (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Draft name"
            placeholderTextColor={Palette.muted}
            style={styles.input}
          />
        ) : null}
        <Text style={styles.note}>
          Audio is saved locally on Android; metadata is stored in your account.
        </Text>
      </View>
      <View style={styles.actions}>
        {isStopped ? (
          <PrimaryButton
            label="Save draft"
            icon="check"
            onPress={() => {
              void saveDraft(name.trim() || "Voice draft", "original");
              router.replace("/(tabs)");
            }}
          />
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
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    color: Palette.text,
    marginTop: 24,
  },
  note: {
    color: Palette.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 250,
    marginTop: 26,
  },
  actions: { gap: 10 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionHalf: { flex: 1 },
});
