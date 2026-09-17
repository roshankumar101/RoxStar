import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton, Screen, ScreenHeader } from "@/components/roxstar-ui";
import { Palette } from "@/constants/theme";
import { getSpinResult } from "@/services/spinService";
import type { SpinParticipant } from "@/types/spin";

export default function WinnerScreen() {
  const router = useRouter();
  const { spinId, roomId } = useLocalSearchParams<{
    spinId: string;
    roomId: string;
  }>();
  const [winner, setWinner] = useState<SpinParticipant | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!spinId) return;
    void getSpinResult(spinId)
      .then((result) =>
        setWinner(
          result.participants.find(
            (participant) => participant.status === "WINNER",
          ) ?? null,
        ),
      )
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "Unable to load result",
        ),
      );
  }, [spinId]);
  const winnerName = winner
    ? typeof winner.userId === "object"
      ? winner.userId.name
      : winner.userId
    : undefined;
  return (
    <Screen scroll={false}>
      <ScreenHeader title="Winner" onBack={() => router.back()} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.center}>
        <View style={styles.icon}>
          <MaterialIcons name="emoji-events" size={48} color={Palette.accent} />
        </View>
        <Text style={styles.heading}>Winner</Text>
        <Text style={styles.name}>{winnerName ?? "Waiting for result..."}</Text>
        <Text style={styles.message}>
          {winner
            ? "Congratulations!"
            : "The server has not announced a winner yet."}
        </Text>
      </View>
      <PrimaryButton
        label="Back to room"
        icon="arrow-back"
        onPress={() =>
          router.replace({ pathname: "/room", params: { roomId } })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: Palette.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  heading: { color: Palette.muted, fontSize: 18, fontWeight: "700" },
  name: { color: Palette.text, fontSize: 42, fontWeight: "800", marginTop: 8 },
  message: { color: Palette.muted, fontSize: 16, marginTop: 10 },
  error: { color: Palette.danger, marginBottom: 12 },
});
