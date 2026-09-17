/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

export const Palette = {
  background: "#FFFFFF",
  surface: "#F9FAFB",
  text: "#111111",
  muted: "#6B7280",
  border: "#E5E7EB",
  accent: "#FF6B35",
  accentSoft: "#FFF1EB",
  success: "#198754",
  danger: "#B42318",
};

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.background,
    tint: Palette.accent,
    icon: Palette.muted,
    tabIconDefault: Palette.muted,
    tabIconSelected: Palette.accent,
  },
  dark: {
    text: Palette.text,
    background: Palette.background,
    tint: Palette.accent,
    icon: Palette.muted,
    tabIconDefault: Palette.muted,
    tabIconSelected: Palette.accent,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
