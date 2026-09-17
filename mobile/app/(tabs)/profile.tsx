import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  PrimaryButton,
  Screen,
  ScreenHeader,
  SectionTitle,
} from "@/components/roxstar-ui";
import { Palette } from "@/constants/theme";
import { getMyHistory } from "@/services/authService";
import { useAuthStore } from "@/stores/auth";
import type { UserHistory } from "@/types/user";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [history, setHistory] = useState<UserHistory | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void getMyHistory()
      .then(setHistory)
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "Unable to load history",
        ),
      );
  }, []);
  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "";
  return (
    <Screen>
      <ScreenHeader title="Profile" />
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.handle}>{user?.email}</Text>
        </View>
      </View>
      <SectionTitle>History</SectionTitle>
      {history ? (
        <>
          <View style={styles.stats}>
            <Stat label="Rooms" value={history.statistics.roomsJoined} />
            <Stat label="Spins" value={history.statistics.spinsParticipated} />
            <Stat label="Wins" value={history.statistics.wins} />
            <Stat
              label="Eliminations"
              value={history.statistics.eliminations}
            />
          </View>
          <SectionTitle>Rooms joined</SectionTitle>
          {history.roomsJoined.length ? (
            history.roomsJoined.map((entry) => (
              <HistoryRow
                key={`${entry.roomId._id}-${entry.joinedAt}`}
                title={entry.roomId.name}
                detail={`${entry.roomId.status}  •  ${new Date(entry.joinedAt).toLocaleDateString()}`}
              />
            ))
          ) : (
            <Text style={styles.empty}>No rooms yet.</Text>
          )}
          <SectionTitle>Spins</SectionTitle>
          {history.spinsParticipated.length ? (
            history.spinsParticipated.map((entry) => (
              <HistoryRow
                key={entry.spinId._id}
                title={entry.spinId.roomId.name}
                detail={`${entry.status}  •  ${new Date(entry.joinedAt).toLocaleDateString()}`}
              />
            ))
          ) : (
            <Text style={styles.empty}>No spins yet.</Text>
          )}
        </>
      ) : (
        <ActivityIndicator color={Palette.accent} />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <SectionTitle>Settings</SectionTitle>
      <View style={styles.list}>
        <SettingRow icon="notifications-none" label="Notifications" />
        <SettingRow icon="info-outline" label="About" />
        <SettingRow icon="layers" label="Version" value="1.0.0" />
      </View>
      <View style={styles.logout}>
        <PrimaryButton
          label="Log out"
          icon="logout"
          onPress={() => void signOut()}
        />
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function HistoryRow({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.historyRow}>
      <Text style={styles.historyTitle}>{title}</Text>
      <Text style={styles.historyDetail}>{detail}</Text>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
}) {
  return (
    <View style={styles.row}>
      <MaterialIcons name={icon} size={22} color={Palette.muted} />
      <Text style={styles.label}>{label}</Text>
      {value ? (
        <Text style={styles.value}>{value}</Text>
      ) : (
        <MaterialIcons name="chevron-right" size={22} color={Palette.muted} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", paddingBottom: 34 },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: Palette.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  initials: { color: Palette.accent, fontSize: 20, fontWeight: "800" },
  name: { color: Palette.text, fontSize: 20, fontWeight: "800" },
  handle: { color: Palette.muted, fontSize: 13, marginTop: 4 },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  stat: { alignItems: "center" },
  statValue: { color: Palette.text, fontSize: 22, fontWeight: "800" },
  statLabel: { color: Palette.muted, fontSize: 12, marginTop: 4 },
  historyRow: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  historyTitle: { color: Palette.text, fontWeight: "700" },
  historyDetail: { color: Palette.muted, fontSize: 12, marginTop: 4 },
  empty: { color: Palette.muted, marginBottom: 18 },
  error: { color: Palette.danger, marginVertical: 14 },
  list: { borderTopWidth: 1, borderTopColor: Palette.border },
  row: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  label: {
    flex: 1,
    color: Palette.text,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 14,
  },
  value: { color: Palette.muted, fontSize: 14 },
  logout: { marginTop: 30 },
});
