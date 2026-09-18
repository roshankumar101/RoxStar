import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  PrimaryButton,
  Screen,
  ScreenHeader,
  SectionTitle,
} from "@/components/roxstar-ui";
import { Palette } from "@/constants/theme";
import { updateDraft } from "@/services/draftService";
import { useStudioStore } from "@/stores/studio";

const effects = ["Original", "Echo", "Reverb", "Pitch shift"];

export default function EffectsScreen() {
  const router = useRouter();
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const draft = useStudioStore((state) =>
    state.drafts.find((item) => item._id === draftId),
  );
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(1);
  const [error, setError] = useState("");
  const selected =
    selectedOverride ??
    (draft
      ? draft.effect === "pitch"
        ? "Pitch shift"
        : `${draft.effect[0].toUpperCase()}${draft.effect.slice(1)}`
      : "Original");
  const save = async () => {
    if (!draft) return;
    const effect =
      selected === "Pitch shift"
        ? "pitch"
        : (selected.toLowerCase() as
            | "original"
            | "echo"
            | "reverb"
            | "pitch");
    setError("");
    try {
      const response = await updateDraft(draft._id, { effect });
      useStudioStore.setState((state) => ({
        drafts: state.drafts.map((item) =>
          item._id === response.draft._id ? response.draft : item,
        ),
      }));
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save effect");
    }
  };
  return (
    <Screen>
      <ScreenHeader
        title="Edit Draft"
        subtitle={draft?.name ?? "Draft"}
        onBack={() => router.back()}
      />
      <SectionTitle>Effects</SectionTitle>
      <View style={styles.effects}>
        {effects.map((effect) => (
          <Pressable
            key={effect}
            onPress={() => setSelectedOverride(effect)}
            style={[styles.effect, selected === effect && styles.selected]}
          >
            <Text
              style={[
                styles.effectText,
                selected === effect && styles.selectedText,
              ]}
            >
              {effect}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sliderHeader}>
        <SectionTitle>Intensity</SectionTitle>
        <Text style={styles.percent}>{intensity * 25}%</Text>
      </View>
      <View style={styles.slider}>
        <View style={[styles.fill, { width: `${intensity * 25}%` }]} />
        {[1, 2, 3, 4].map((step) => (
          <Pressable
            key={step}
            accessibilityLabel={`Set intensity to ${step * 25}%`}
            onPress={() => setIntensity(step)}
            style={[styles.tick, { left: `${step * 25}%` }]}
          />
        ))}
      </View>
      <Text style={styles.helper}>
        Effect metadata is saved to your backend draft.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.bottom}>
        <PrimaryButton
          label="Save draft"
          icon="check"
          onPress={() => void save()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  effects: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 34,
  },
  effect: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
  },
  selected: {
    backgroundColor: Palette.accentSoft,
    borderColor: Palette.accent,
  },
  effectText: { color: Palette.text, fontSize: 14, fontWeight: "600" },
  selectedText: { color: Palette.accent },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  percent: { color: Palette.accent, fontWeight: "700" },
  slider: {
    height: 6,
    backgroundColor: Palette.border,
    borderRadius: 3,
    position: "relative",
    marginTop: 12,
    marginBottom: 18,
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: Palette.accent },
  tick: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.accent,
    top: -6,
    marginLeft: -9,
  },
  helper: { color: Palette.muted, fontSize: 13, lineHeight: 20 },
  error: { color: Palette.danger, fontSize: 13, marginTop: 14 },
  bottom: { marginTop: 40 },
});
