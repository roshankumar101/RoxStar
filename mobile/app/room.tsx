import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  ParticipantRow,
  PrimaryButton,
  Screen,
  ScreenHeader,
  SecondaryButton,
  SectionTitle,
  formatDuration,
} from "@/components/roxstar-ui";
import { Palette } from "@/constants/theme";
import { getRoom, leaveRoom } from "@/services/roomService";
import { shareDraft } from "@/services/draftService";
import {
  connectSocket,
  joinRoomSocket,
  leaveRoomSocket,
  subscribeRoom,
} from "@/services/socketService";
import { getAccessToken } from "@/services/apiService";
import type { RoomState } from "@/types/room";
import { useStudioStore } from "@/stores/studio";
import { useAuthStore } from "@/stores/auth";

export default function RoomScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState("");
  const drafts = useStudioStore((store) => store.drafts);
  const currentUser = useAuthStore((store) => store.user);
  const refresh = async () => {
    if (!roomId) return;
    try {
      setState(await getRoom(roomId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load room");
    }
  };
  useEffect(() => {
    if (!roomId) return undefined;
    const openSpin = (spinId: string) => {
      router.push({ pathname: "/spin", params: { roomId, spinId } });
    };
    const reload = () => {
      void getRoom(roomId)
        .then((roomState) => {
          setState(roomState);
          if (roomState.activeSpin) {
            openSpin(roomState.activeSpin._id);
          }
        })
        .catch((cause) =>
          setError(
            cause instanceof Error ? cause.message : "Unable to load room",
          ),
        );
    };
    reload();
    const token = getAccessToken();
    if (!token) return undefined;
    connectSocket(token);
    joinRoomSocket(roomId);
    const unsubscribe = subscribeRoom({
      room_state: setState,
      user_joined: reload,
      user_left: reload,
      draft_shared: reload,
      spin_started: (payload) => {
        if (typeof payload === "object" && payload && "spinId" in payload) {
          openSpin(String(payload.spinId));
        }
      },
    });
    return () => {
      unsubscribe();
      leaveRoomSocket(roomId);
    };
  }, [roomId, router]);
  const shareLatest = async () => {
    const draft = drafts[0];
    if (!roomId || !draft) {
      setError("Create a draft before sharing it.");
      return;
    }
    try {
      await shareDraft(roomId, {
        draftId: draft._id,
        name: draft.name,
        duration: draft.duration,
        effect: draft.effect,
        fileUrl: draft.fileUrl,
      });
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to share draft",
      );
    }
  };
  const leave = async () => {
    try {
      if (roomId) {
        await leaveRoom(roomId);
        leaveRoomSocket(roomId);
      }
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to leave room");
    }
  };
  if (!state)
    return (
      <Screen>
        <ScreenHeader title="Room" onBack={() => router.back()} />
        <Text style={styles.message}>{error || "Loading room..."}</Text>
      </Screen>
    );
  return (
    <Screen>
      <ScreenHeader
        title={state.room.name}
        subtitle={`#${state.room.code}  •  ${state.room.status}`}
        onBack={() => void leave()}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <SectionTitle>Participants</SectionTitle>
      <View style={styles.block}>
        {state.members.map((member) => {
          const user =
            typeof member.userId === "string"
              ? member.userId
              : member.userId.name;
          const userId =
            typeof member.userId === "string"
              ? member.userId
              : member.userId._id;
          return (
            <ParticipantRow
              key={userId}
              name={user}
              isCurrent={userId === currentUser?.id}
            />
          );
        })}
      </View>
      <View style={styles.section}>
        <SectionTitle>Shared drafts</SectionTitle>
        {state.drafts.length ? (
          state.drafts.map((draft) => (
            <View style={styles.draft} key={draft._id}>
              <MaterialIcons
                name="graphic-eq"
                size={20}
                color={Palette.accent}
              />
              <Text style={styles.draftText}>{draft.name}</Text>
              <Text style={styles.duration}>
                {formatDuration(draft.duration)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.message}>No shared drafts yet.</Text>
        )}
      </View>
      <View style={styles.actions}>
        <SecondaryButton
          label="Share latest draft"
          icon="upload"
          onPress={() => void shareLatest()}
        />
        <View style={styles.gap} />
        {String(state.room.ownerId) === currentUser?.id &&
        state.room.status === "WAITING" &&
        state.members.length >= 3 &&
        state.members.length <= 20 ? (
          <>
            <PrimaryButton
              label="Start spin"
              icon="casino"
              onPress={() =>
                router.push({
                  pathname: "/spin",
                  params: { roomId: state.room._id },
                })
              }
            />
            <View style={styles.gap} />
          </>
        ) : null}
        <SecondaryButton
          label="Leave room"
          icon="exit-to-app"
          onPress={() => void leave()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { borderTopWidth: 1, borderTopColor: Palette.border },
  section: { marginTop: 34 },
  draft: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  draftText: {
    flex: 1,
    color: Palette.text,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 12,
  },
  duration: { color: Palette.muted, fontSize: 12 },
  actions: { marginTop: 38 },
  gap: { height: 10 },
  message: { color: Palette.muted, fontSize: 15 },
  error: { color: Palette.danger, marginBottom: 16 },
});
