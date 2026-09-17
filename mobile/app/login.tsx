import { Link, useRouter, type RelativePathString } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { PrimaryButton, Screen, ScreenHeader } from "@/components/roxstar-ui";
import { Palette } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth";

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = async () => {
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch {
      /* state exposes the error */
    }
  };
  return (
    <Screen scroll={false}>
      <ScreenHeader
        title="Welcome back"
        subtitle="Sign in to your ROXSTAR account"
      />
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={Palette.muted}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholder="Your password"
          placeholderTextColor={Palette.muted}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={loading ? "Signing in..." : "Sign in"}
          onPress={() => void submit()}
        />
        {loading ? (
          <ActivityIndicator color={Palette.accent} style={styles.spinner} />
        ) : null}
        <Text style={styles.footer}>
          New to ROXSTAR?{" "}
          <Link href={"/register" as RelativePathString} style={styles.link}>
            Create an account
          </Link>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: 14 },
  label: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    color: Palette.text,
    fontSize: 16,
  },
  error: { color: Palette.danger, marginVertical: 14 },
  spinner: { marginTop: 12 },
  footer: { color: Palette.muted, textAlign: "center", marginTop: 28 },
  link: { color: Palette.accent, fontWeight: "700" },
});
