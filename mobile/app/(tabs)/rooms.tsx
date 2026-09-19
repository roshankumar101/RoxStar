import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  PrimaryButton,
  RoomCard,
  Screen,
  ScreenHeader,
  SecondaryButton,
  SectionTitle,
} from "@/components/roxstar-ui";
import { Palette } from "@/constants/theme";
import { createRoom, joinRoom } from "@/services/roomService";
import { getMyHistory } from "@/services/authService";
import type { Room } from "@/types/room";

export default function RoomsScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      try {
        const history = await getMyHistory();
        const activeRoomIds = new Set(
          history.roomsJoined
            .filter((item) => item.isActive)
            .map((item) => item.roomId._id),
        );
        const all = [
          ...history.roomsJoined
            .filter((item) => item.isActive)
            .map((item) => item.roomId),
          ...history.roomsCreated.filter((room) => activeRoomIds.has(room._id)),
        ];
        setRooms(
          Array.from(new Map(all.map((room) => [room._id, room])).values()),
        );
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Unable to load rooms",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const handleJoin = async () => {
    if (code.trim().length !== 6) {
      setError("Enter a 6-character room code.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      const response = await joinRoom(code.trim());
      router.push({
        pathname: "/room",
        params: { roomId: response.room._id, code: response.room.code },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to join room");
    } finally {
      setWorking(false);
    }
  };
  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Enter a room name.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      const response = await createRoom(name.trim());
      router.push({
        pathname: "/room",
        params: { roomId: response.room._id, code: response.room.code },
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to create room",
      );
    } finally {
      setWorking(false);
    }
  };
  return (
    <Screen showBrand={false}>
      <ScreenHeader title="Rooms" subtitle="Collaborate with others" />
      <TextInput
        value={name}
        onChangeText={(value) => {
          setName(value);
          setError("");
        }}
        placeholder="Enter New room name"
        placeholderTextColor={Palette.muted}
        style={styles.input}
      />
      <PrimaryButton
        label={working ? "Creating..." : "Create room"}
        icon="add"
        onPress={() => void handleCreate()}
      />
      <View style={[styles.gap, { marginBottom: 10 }]} />
      <TextInput
        autoCapitalize="characters"
        maxLength={6}
        value={code}
        onChangeText={(value) => {
          setCode(value.replace(/[^a-z0-9]/gi, "").toUpperCase());
          setError("");
        }}
        placeholder="Enter room code"
        placeholderTextColor={Palette.muted}
        style={styles.input}
      />
      <SecondaryButton
        label={working ? "Joining..." : "Join room"}
        icon="login"
        onPress={() => void handleJoin()}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.section}>
        <SectionTitle>Your rooms</SectionTitle>
        {loading ? (
          <ActivityIndicator color={Palette.accent} />
        ) : rooms.length ? (
          rooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              onPress={() =>
                router.push({
                  pathname: "/room",
                  params: { roomId: room._id, code: room.code },
                })
              }
            />
          ))
        ) : (
          <Text style={styles.empty}>No rooms yet.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: Palette.text,
    fontSize: 16,
    marginBottom: 7,
  },
  hint: { color: Palette.muted, fontSize: 12, marginBottom: 14 },
  error: { color: Palette.danger, fontSize: 13, marginTop: 14 },
  gap: { height: 10 },
  section: { marginTop: 34 },
  empty: { color: Palette.muted, fontSize: 15 },
});
