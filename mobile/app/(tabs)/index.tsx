import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text } from "react-native";

import {
  DraftCard,
  EmptyState,
  PrimaryButton,
  Screen,
  ScreenHeader,
} from "@/components/roxstar-ui";
import { useStudioStore } from "@/stores/studio";
import { Palette } from "@/constants/theme";

export default function HomeScreen() {
  const router = useRouter();
  const drafts = useStudioStore((state) => state.drafts);
  const deleteDraft = useStudioStore((state) => state.deleteDraft);
  const loadDrafts = useStudioStore((state) => state.loadDrafts);
  const loading = useStudioStore((state) => state.loading);
  const error = useStudioStore((state) => state.error);
  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  return (
    <Screen>
      <ScreenHeader title="Drafts" subtitle="Your voice ideas" />
      {loading ? <ActivityIndicator color={Palette.accent} /> : null}
      {error ? (
        <Text style={{ color: Palette.danger, marginBottom: 16 }}>{error}</Text>
      ) : null}
      {!loading && drafts.length
        ? drafts.map((draft) => (
            <DraftCard
              key={draft._id}
              draft={draft}
              onPlay={() => undefined}
              onDelete={() => void deleteDraft(draft._id)}
              onEdit={() =>
                router.push({
                  pathname: "/effects",
                  params: { draftId: draft._id },
                })
              }
            />
          ))
        : null}
      {!loading && !drafts.length ? (
        <EmptyState
          title="No drafts yet"
          body="Record your first voice draft."
          action={
            <PrimaryButton
              label="Record"
              icon="mic"
              onPress={() => router.push("/recording")}
            />
          }
        />
      ) : null}
      {drafts.length ? (
        <PrimaryButton
          label="Record"
          icon="add"
          onPress={() => router.push("/recording")}
        />
      ) : null}
    </Screen>
  );
}
