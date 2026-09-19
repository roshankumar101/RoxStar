import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

function ParticipantList({
  participants,
  variant,
}: {
  participants: SpinParticipant[];
  variant: "current" | "eliminated" | "winner";
}) {
  if (!participants.length) {
    return <Text style={styles.emptyText}>No players to show.</Text>;
  }
  return (
    <View style={styles.list}>
      {participants.map((participant) => (
        <View key={participant._id} style={styles.participantRow}>
          {variant === "current" ? (
            <View style={styles.activeDot} />
          ) : (
            <MaterialIcons
              name={variant === "winner" ? "emoji-events" : "check"}
              size={18}
              color={
                variant === "winner" ? Palette.accent : Palette.danger
              }
            />
          )}
          <Text
            style={
              variant === "current"
                ? styles.participantName
                : variant === "winner"
                  ? styles.winnerRowName
                  : styles.eliminatedName
            }
          >
            {participantName(participant)}
            {participant.status === "WITHDRAWN" ? " (left game)" : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function SpinScreen() {
  const router = useRouter();
  const { roomId, spinId: initialSpinId } = useLocalSearchParams<{
    roomId: string;
    spinId?: string;
  }>();
  const currentUser = useAuthStore((state) => state.user);
  const spinIdRef = useRef(initialSpinId ?? "");
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
        spinIdRef.current = response.spin._id;
        setSpin(response.spin);
        setParticipants(response.participants);
        setSpinning(response.spin.status === "RUNNING");
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Unable to load spin"),
      );
  }, [initialSpinId]);

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
        spinIdRef.current = nextState.activeSpin._id;
        setSpin(nextState.activeSpin);
        setParticipants(nextState.spinParticipants ?? []);
        setSpinning(nextState.activeSpin.status === "RUNNING");
      }
    };
    const refreshSpin = (spinId: string) => {
      void getSpin(spinId)
        .then((response) => {
          spinIdRef.current = response.spin._id;
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
        if (!nextState.activeSpin && spinIdRef.current) {
          refreshSpin(spinIdRef.current);
        }
      },
      spin_started: (payload) => {
        const spinId = eventSpinId(payload);
        if (spinId) spinIdRef.current = spinId;
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
        const data = eventPayload(payload);
        const spinId = eventSpinId(payload) || spinIdRef.current;
        const snapshot = eventParticipants(payload);
        if (snapshot) setParticipants(snapshot);
        setSpinning(false);
        if (spinId) spinIdRef.current = spinId;
        setSpin((current) =>
          current && (!spinId || current._id === spinId)
            ? {
                ...current,
                status: "COMPLETED",
                winnerId: data.userId ? String(data.userId) : current.winnerId,
                nextEliminationAt: undefined,
              }
            : current,
        );
        if (spinId) refreshSpin(spinId);
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
      spinIdRef.current = response.spin._id;
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
  const winnerParticipant =
    participants.find((participant) => participant.status === "WINNER") ??
    participants.find(
      (participant) =>
        spin?.winnerId && participantId(participant) === String(spin.winnerId),
    );
  const remainingParticipants = winnerParticipant
    ? [winnerParticipant]
    : activeParticipants;
  const removedParticipants = [
    ...eliminatedParticipants,
    ...withdrawnParticipants,
  ];
  const latestEliminated =
    eliminatedParticipants.find(
      (participant) => participantId(participant) === latestEliminatedId,
    ) ?? eliminatedParticipants.at(-1);
  const currentRound =
    spin?.status === "COMPLETED"
      ? Math.max(1, (spin.round ?? eliminatedParticipants.length + 1) - 1)
      : (spin?.round ?? eliminatedParticipants.length + 1);
  const totalParticipants = participants.length;
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
        title="Spin"
        subtitle={spin ? `Status: ${spin.status}` : "Waiting to start"}
        onBack={() => router.back()}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.wheelArea}>
        <Animated.View
          style={[styles.wheel, { transform: [{ rotate: spinRotation }] }]}
        >
          <View style={styles.wheelRing} />
          <View style={styles.wheelMarkTop} />
          <View style={styles.wheelMarkRight} />
          <View style={styles.wheelMarkBottom} />
          <View style={styles.wheelMarkLeft} />
          <View style={styles.hub}>
            <MaterialIcons name="casino" size={24} color="#FFFFFF" />
          </View>
        </Animated.View>
        <Text style={styles.spinLabel}>
          {spinning ? "Server round in progress" : spin?.status ?? "Ready"}
        </Text>
      </View>

      {winnerParticipant ? (
        <View style={styles.winnerBanner}>
          <MaterialIcons name="emoji-events" size={32} color={Palette.accent} />
          <Text style={styles.winnerLabel}>WINNER</Text>
          <Text style={styles.winnerName}>
            {participantName(winnerParticipant)}
          </Text>
        </View>
      ) : null}

      <View style={styles.roundSummary}>
        <View>
          <Text style={styles.roundLabel}>ROUND {currentRound}</Text>
          <Text style={styles.remainingText}>
            Players Remaining: {remainingParticipants.length}/
            {totalParticipants || 0}
          </Text>
        </View>
        {spinning ? (
          <View style={styles.countdownBlock}>
            <Text style={styles.countdownValue}>{countdown}</Text>
            <Text style={styles.countdownLabel}>SECONDS</Text>
          </View>
        ) : null}
      </View>

      {latestEliminated ? (
        <View style={styles.eliminationNotice}>
          <MaterialIcons name="person-remove" size={22} color={Palette.danger} />
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeLabel}>LATEST ELIMINATION</Text>
            <Text style={styles.noticeName}>
              {participantName(latestEliminated)} was eliminated
            </Text>
          </View>
        </View>
      ) : null}

      <SectionTitle>
        {winnerParticipant ? "Winner" : "Current players"}
      </SectionTitle>
      <ParticipantList
        participants={remainingParticipants}
        variant={winnerParticipant ? "winner" : "current"}
      />

      {removedParticipants.length ? (
        <View style={styles.eliminatedSection}>
          <SectionTitle>Eliminated</SectionTitle>
          <ParticipantList
            participants={removedParticipants}
            variant="eliminated"
          />
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
  winnerBanner: {
    alignItems: "center",
    borderWidth: 2,
    borderColor: Palette.accent,
    backgroundColor: Palette.accentSoft,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  winnerLabel: {
    color: Palette.accent,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
  },
  winnerName: {
    color: Palette.text,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
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
  roundSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    paddingBottom: 18,
    marginBottom: 20,
  },
  roundLabel: { color: Palette.text, fontSize: 18, fontWeight: "800" },
  remainingText: { color: Palette.muted, fontSize: 14, marginTop: 5 },
  countdownBlock: { alignItems: "flex-end" },
  countdownValue: { color: Palette.text, fontSize: 24, fontWeight: "800" },
  countdownLabel: { color: Palette.muted, fontSize: 10, fontWeight: "700" },
  wheelArea: { alignItems: "center", paddingBottom: 30 },
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
  wheelRing: {
    position: "absolute",
    top: 24,
    left: 24,
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    opacity: 0.55,
  },
  wheelMarkTop: {
    position: "absolute",
    top: 14,
    left: 94,
    width: 8,
    height: 26,
    backgroundColor: "#FFFFFF",
  },
  wheelMarkRight: {
    position: "absolute",
    top: 94,
    right: 14,
    width: 26,
    height: 8,
    backgroundColor: "#FFFFFF",
  },
  wheelMarkBottom: {
    position: "absolute",
    bottom: 14,
    left: 94,
    width: 8,
    height: 26,
    backgroundColor: "#FFFFFF",
  },
  wheelMarkLeft: {
    position: "absolute",
    top: 94,
    left: 14,
    width: 26,
    height: 8,
    backgroundColor: "#FFFFFF",
  },
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
  winnerRowName: {
    flex: 1,
    color: Palette.text,
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 9,
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