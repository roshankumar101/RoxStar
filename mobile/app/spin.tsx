import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { PrimaryButton, Screen, ScreenHeader } from "@/components/roxstar-ui";
import { Palette } from "@/constants/theme";
import { getAccessToken } from "@/services/apiService";
import { getSpin, startSpin } from "@/services/spinService";
import {
  connectSocket,
  joinRoomSocket,
  leaveRoomSocket,
  subscribeRoom,
} from "@/services/socketService";
import type { Spin, SpinParticipant } from "@/types/spin";

export default function SpinScreen() {
  const router = useRouter();
  const { roomId, spinId: initialSpinId } = useLocalSearchParams<{
    roomId: string;
    spinId?: string;
  }>();
  const [rotation] = useState(() => new Animated.Value(0));
  const [spinning, setSpinning] = useState(false);
  const [spin, setSpin] = useState<Spin | null>(null);
  const [participants, setParticipants] = useState<SpinParticipant[]>([]);
  const [error, setError] = useState("");
  useEffect(() => () => rotation.stopAnimation(), [rotation]);

  useEffect(() => {
    if (!initialSpinId) return;
    void getSpin(initialSpinId)
      .then((response) => {
        setSpin(response.spin);
        setParticipants(response.participants);
        setSpinning(response.spin.status === "RUNNING");
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Unable to load spin"),
      );
  }, [initialSpinId]);

  useEffect(() => {
    if (!roomId) return undefined;
    const token = getAccessToken();
    if (!token) return undefined;
    connectSocket(token);
    joinRoomSocket(roomId);
    const unsubscribe = subscribeRoom({
      spin_started: (payload) => {
        const spinId =
          typeof payload === "object" && payload && "spinId" in payload
            ? String(payload.spinId)
            : "";
        if (spinId) {
          void getSpin(spinId)
            .then((response) => {
              setSpin(response.spin);
              setParticipants(response.participants);
              setSpinning(true);
            })
            .catch((cause) =>
              setError(
                cause instanceof Error ? cause.message : "Unable to load spin",
              ),
            );
        }
      },
      user_eliminated: (payload) => {
        const spinId =
          typeof payload === "object" && payload && "spinId" in payload
            ? String(payload.spinId)
            : "";
        if (spinId) {
          void getSpin(spinId)
            .then((response) => {
              setSpin(response.spin);
              setParticipants(response.participants);
            })
            .catch((cause) =>
              setError(
                cause instanceof Error ? cause.message : "Unable to update spin",
              ),
            );
        }
      },
      winner_announced: (payload) => {
        const spinId =
          typeof payload === "object" && payload && "spinId" in payload
            ? String(payload.spinId)
            : spin?._id;
        if (spinId)
          router.replace({
            pathname: "/winner",
            params: { spinId, roomId },
          });
      },
    });
    return () => {
      unsubscribe();
      leaveRoomSocket(roomId);
    };
  }, [roomId, router]);

  const beginSpin = async () => {
    if (!roomId || spinning) return;
    setError("");
    try {
      const response = await startSpin(roomId);
      setSpin(response.spin);
      setSpinning(true);
      rotation.setValue(0);
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      const current = await getSpin(response.spin._id);
      setParticipants(current.participants);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start spin");
    }
  };

  const spinRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "720deg"],
  });
  return (
    <Screen scroll={false}>
      <ScreenHeader
        title="Spin"
        subtitle={spin ? spin.status : "Server-authoritative room spin"}
        onBack={() => router.back()}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.center}>
        <Animated.View
          style={[styles.wheel, { transform: [{ rotate: spinRotation }] }]}
        >
          {participants.slice(0, 6).map((participant, index) => (
            <View
              key={participant._id}
              style={[
                styles.wedge,
                { top: 20 + (index % 3) * 62, left: index < 3 ? 25 : 135 },
              ]}
            >
              <Text style={styles.wedgeText}>
                {typeof participant.userId === "string"
                  ? participant.userId.slice(-4)
                  : participant.userId.name}
              </Text>
            </View>
          ))}
          <View style={styles.hub}>
            <MaterialIcons name="casino" size={26} color="#FFFFFF" />
          </View>
        </Animated.View>
        <Text style={styles.label}>
          {spinning ? "Waiting for server events..." : "Ready"}
        </Text>
      </View>
      {!spin && !initialSpinId ? (
        <PrimaryButton
          label="Start spin"
          icon="refresh"
          onPress={() => void beginSpin()}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  wheel: {
    width: 244,
    height: 244,
    borderRadius: 122,
    borderWidth: 10,
    borderColor: Palette.accentSoft,
    backgroundColor: Palette.accent,
    overflow: "hidden",
    position: "relative",
  },
  wedge: { position: "absolute", width: 78, alignItems: "center" },
  wedgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  hub: {
    position: "absolute",
    top: 92,
    left: 92,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.text,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    marginTop: 24,
  },
  error: { color: Palette.danger, marginBottom: 12 },
});
