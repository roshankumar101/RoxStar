import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import {
  PrimaryButton,
  Screen,
  ScreenHeader,
  SectionTitle,
} from "@/components/roxstar-ui";
import { Palette } from "@/constants/theme";
import { getAccessToken } from "@/services/apiService";
import { getRoom } from "@/services/roomService";
import { getSpin, startSpin } from "@/services/spinService";
import {
  connectSocket,
  joinRoomSocket,
  leaveRoomSocket,
  subscribeRoom,
} from "@/services/socketService";
import { useAuthStore } from "@/stores/auth";
import type { RoomState } from "@/types/room";
import type { Spin, SpinParticipant } from "@/types/spin";

type SpinEventPayload = {
  spinId?: unknown;
  userId?: unknown;
  round?: unknown;
  nextEliminationAt?: unknown;
  participants?: unknown;
};

function eventPayload(payload: unknown): SpinEventPayload {
  return typeof payload === "object" && payload ? payload : {};
}

function eventSpinId(payload: unknown): string {
  const value = eventPayload(payload).spinId;
  return value ? String(value) : "";
}

function eventParticipants(payload: unknown): SpinParticipant[] | null {
  const value = eventPayload(payload).participants;
  return Array.isArray(value) ? (value as SpinParticipant[]) : null;
}

function participantId(participant: SpinParticipant): string {
  return typeof participant.userId === "string"
    ? participant.userId
    : participant.userId._id;
}

function participantName(participant: SpinParticipant): string {
  return typeof participant.userId === "string"
    ? `Player ${participant.userId.slice(-4)}`
    : participant.userId.name;
}

export default function SpinScreen() {
  const router = useRouter();
  const { roomId, spinId: initialSpinId } = useLocalSearchParams<{
    roomId: string;
    spinId?: string;
  }>();
  const currentUser = useAuthStore((state) => state.user);
  const [rotation] = useState(() => new Animated.Value(0));
  const [spinning, setSpinning] = useState(false);
  const [spin, setSpin] = useState<Spin | null>(null);
  const [participants, setParticipants] = useState<SpinParticipant[]>([]);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [latestEliminatedId, setLatestEliminatedId] = useState("");
  const [countdown, setCountdown] = useState(0);
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
    if (spin?.status === "COMPLETED" && roomId) {
      router.replace({
        pathname: "/winner",
        params: { spinId: spin._id, roomId },
      });
    }
  }, [roomId, router, spin?._id, spin?.status]);

  useEffect(() => {
    if (spin?.status !== "RUNNING" || !spin.nextEliminationAt) {
      setCountdown(0);
      return undefined;
    }
    const updateCountdown = () => {
      const target = new Date(spin.nextEliminationAt!).getTime();
      setCountdown(Math.max(0, Math.ceil((target - Date.now()) / 1000)));
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 250);
    return () => clearInterval(timer);
  }, [spin?.nextEliminationAt, spin?.status]);

  useEffect(() => {
    if (!roomId) return undefined;
    const applyRoomState = (nextState: RoomState) => {
      setRoomState(nextState);
      if (nextState.activeSpin) {
        setSpin(nextState.activeSpin);
        setParticipants(nextState.spinParticipants ?? []);
        setSpinning(nextState.activeSpin.status === "RUNNING");
      }
    };
    const refreshSpin = (spinId: string) => {
      void getSpin(spinId)
        .then((response) => {
          setSpin(response.spin);
          setParticipants(response.participants);
          setSpinning(response.spin.status === "RUNNING");
        })
        .catch((cause) =>
          setError(
            cause instanceof Error ? cause.message : "Unable to update spin",
          ),
        );
    };
    const animateRound = () => {
      rotation.stopAnimation();
      rotation.setValue(0);
      Animated.timing(rotation, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    };

    void getRoom(roomId)
      .then(applyRoomState)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Unable to load room"),
      );

    const token = getAccessToken();
    if (!token) return undefined;
    connectSocket(token);
    joinRoomSocket(roomId);
    const unsubscribe = subscribeRoom({
      room_state: (nextState) => {
        applyRoomState(nextState);
        if (!nextState.activeSpin && initialSpinId) {
          refreshSpin(initialSpinId);
        }
      },
      spin_started: (payload) => {
        const spinId = eventSpinId(payload);
        const snapshot = eventParticipants(payload);
        if (snapshot) setParticipants(snapshot);
        if (spinId) refreshSpin(spinId);
        setSpinning(true);
        animateRound();
      },
      user_eliminated: (payload) => {
        const data = eventPayload(payload);
        const spinId = eventSpinId(payload);
        const snapshot = eventParticipants(payload);
        if (snapshot) setParticipants(snapshot);
        if (data.userId) setLatestEliminatedId(String(data.userId));
        setSpin((current) => {
          if (!current || (spinId && current._id !== spinId)) return current;
          const eliminatedRound = Number(data.round);
          return {
            ...current,
            round: Number.isFinite(eliminatedRound)
              ? eliminatedRound + 1
              : current.round,
            nextEliminationAt:
              typeof data.nextEliminationAt === "string"
                ? data.nextEliminationAt
                : current.nextEliminationAt,
          };
        });
        if (spinId) refreshSpin(spinId);
        animateRound();
      },
      winner_announced: (payload) => {
        const spinId = eventSpinId(payload) || initialSpinId;
        const snapshot = eventParticipants(payload);
        if (snapshot) setParticipants(snapshot);
        setSpinning(false);
        if (spinId) {
          router.replace({ pathname: "/winner", params: { spinId, roomId } });
        }
      },
    });
    return () => {
      unsubscribe();
      leaveRoomSocket(roomId);
    };
  }, [initialSpinId, roomId, rotation, router]);

  const beginSpin = async () => {
    if (!roomId || spinning) return;
    setError("");
    try {
      const response = await startSpin(roomId);
      setSpin(response.spin);
      const current = await getSpin(response.spin._id);
      setSpin(current.spin);
      setParticipants(current.participants);
      setSpinning(current.spin.status === "RUNNING");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start spin");
    }
  };

  const activeParticipants = participants.filter(
    (participant) => participant.status === "ACTIVE",
  );
  const eliminatedParticipants = participants
    .filter((participant) => participant.status === "ELIMINATED")
    .sort(
      (left, right) =>
        (left.eliminationOrder ?? 0) - (right.eliminationOrder ?? 0),
    );
  const withdrawnParticipants = participants.filter(
    (participant) => participant.status === "WITHDRAWN",
  );
  const latestEliminated =
    eliminatedParticipants.find(
      (participant) => participantId(participant) === latestEliminatedId,
    ) ?? eliminatedParticipants.at(-1);
  const currentRound = spin?.round ?? eliminatedParticipants.length + 1;
  const spinRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "1440deg"],
  });
  const canStart =
    !spin &&
    !initialSpinId &&
    roomState?.room.status === "WAITING" &&
    String(roomState.room.ownerId) === currentUser?.id &&
    roomState.members.length >= 3 &&
    roomState.members.length <= 20;

  return (
    <Screen>
      <ScreenHeader
        title={`Round ${currentRound}`}
        subtitle={spin ? `Status: ${spin.status}` : "Waiting to start"}
        onBack={() => router.back()}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {latestEliminated ? (
        <View style={styles.eliminationNotice}>
          <MaterialIcons name="person-remove" size={22} color={Palette.danger} />
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeLabel}>ELIMINATED</Text>
            <Text style={styles.noticeName}>
              {participantName(latestEliminated)} has been eliminated
            </Text>
          </View>
        </View>
      ) : null}
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.summaryValue}>{activeParticipants.length}</Text>
          <Text style={styles.summaryLabel}>STILL IN GAME</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryValue}>{countdown}</Text>
          <Text style={styles.summaryLabel}>SECONDS</Text>
        </View>
      </View>
      <View style={styles.wheelArea}>
        <Animated.View
          style={[styles.wheel, { transform: [{ rotate: spinRotation }] }]}
        >
          {activeParticipants.slice(0, 6).map((participant, index) => (
            <View
              key={participant._id}
              style={[
                styles.wedge,
                { top: 18 + (index % 3) * 54, left: index < 3 ? 18 : 116 },
              ]}
            >
              <Text numberOfLines={1} style={styles.wedgeText}>
                {participantName(participant)}
              </Text>
            </View>
          ))}
          <View style={styles.hub}>
            <MaterialIcons name="casino" size={24} color="#FFFFFF" />
          </View>
        </Animated.View>
        <Text style={styles.spinLabel}>
          {spinning ? "Server round in progress" : spin?.status ?? "Ready"}
        </Text>
      </View>
      <SectionTitle>Still in game</SectionTitle>
      <View style={styles.list}>
        {activeParticipants.length ? (
          activeParticipants.map((participant) => (
            <View key={participant._id} style={styles.participantRow}>
              <View style={styles.activeDot} />
              <Text style={styles.participantName}>
                {participantName(participant)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Waiting for participant state.</Text>
        )}
      </View>
      {eliminatedParticipants.length || withdrawnParticipants.length ? (
        <View style={styles.eliminatedSection}>
          <SectionTitle>Eliminated</SectionTitle>
          <View style={styles.list}>
            {[...eliminatedParticipants, ...withdrawnParticipants].map(
              (participant) => (
                <View key={participant._id} style={styles.participantRow}>
                  <MaterialIcons name="close" size={18} color={Palette.danger} />
                  <Text style={styles.eliminatedName}>
                    {participantName(participant)}
                    {participant.status === "WITHDRAWN" ? " (left game)" : ""}
                  </Text>
                </View>
              ),
            )}
          </View>
        </View>
      ) : null}
      {canStart ? (
        <View style={styles.startAction}>
          <PrimaryButton
            label="Start spin"
            icon="refresh"
            onPress={() => void beginSpin()}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: Palette.danger, marginBottom: 16 },
  eliminationNotice: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: Palette.danger,
    backgroundColor: Palette.surface,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  noticeCopy: { flex: 1, marginLeft: 12 },
  noticeLabel: { color: Palette.danger, fontSize: 11, fontWeight: "800" },
  noticeName: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    paddingBottom: 16,
  },
  summaryRight: { alignItems: "flex-end" },
  summaryValue: { color: Palette.text, fontSize: 28, fontWeight: "800" },
  summaryLabel: { color: Palette.muted, fontSize: 11, fontWeight: "700" },
  wheelArea: { alignItems: "center", paddingVertical: 30 },
  wheel: {
    width: 214,
    height: 214,
    borderRadius: 107,
    borderWidth: 9,
    borderColor: Palette.accentSoft,
    backgroundColor: Palette.accent,
    overflow: "hidden",
    position: "relative",
  },
  wedge: { position: "absolute", width: 80, alignItems: "center" },
  wedgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  hub: {
    position: "absolute",
    top: 76,
    left: 76,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Palette.text,
    alignItems: "center",
    justifyContent: "center",
  },
  spinLabel: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 16,
  },
  list: { borderTopWidth: 1, borderTopColor: Palette.border },
  participantRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  activeDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Palette.success,
    marginRight: 12,
  },
  participantName: {
    flex: 1,
    color: Palette.text,
    fontSize: 15,
    fontWeight: "600",
  },
  eliminatedName: {
    flex: 1,
    color: Palette.muted,
    fontSize: 15,
    marginLeft: 8,
  },
  emptyText: { color: Palette.muted, fontSize: 14, paddingVertical: 16 },
  eliminatedSection: { marginTop: 28 },
  startAction: { marginTop: 30 },
});