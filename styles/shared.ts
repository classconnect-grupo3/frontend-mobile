import { StyleSheet } from "react-native"

// Color palette
export const Colors = {
  // Primary colors
  primary: "#007AFF",
  primaryLight: "#E3F2FD",
  primaryDark: "#0056CC",

  // Secondary colors
  secondary: "#6C757D",
  secondaryLight: "#F8F9FA",
  secondaryDark: "#495057",

  secondaryButtonBackground: "#E8F4FD",
  secondaryButtonText: "#1976D2",
    secondaryButtonBorder: "#1976D2",

  // Accent colors
  success: "#4CAF50",
  successLight: "#E8F5E8",
  successDark: "#388E3C",

  warning: "#FF9800",
  warningLight: "#FFF3E0",
  warningDark: "#F57C00",

  danger: "#F44336",
  dangerLight: "#FFEBEE",
  dangerDark: "#D32F2F",

  info: "#2196F3",
  infoLight: "#E3F2FD",
  infoDark: "#1976D2",

  // Neutral colors
  white: "#FFFFFF",
  light: "#F8F9FA",
  lesslight: "#eaeef2",
  lightGray: "#E9ECEF",
  gray: "#6C757D",
  darkGray: "#495057",
  dark: "#212529",
  black: "#000000",

  // Text colors
  textPrimary: "#212529",
  textSecondary: "#6C757D",
  textMuted: "#ADB5BD",
  textLight: "#FFFFFF",
}

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

// Border radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
}

// Shadows
export const Shadows = {
  small: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
}

// Typography
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.textPrimary,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  h5: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  h6: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  body1: {
    fontSize: 16,
    fontWeight: "normal" as const,
    color: Colors.textPrimary,
  },
  body2: {
    fontSize: 14,
    fontWeight: "normal" as const,
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: 12,
    fontWeight: "normal" as const,
    color: Colors.textSecondary,
  },
  overline: {
    fontSize: 10,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
  },
}

// Button styles
export const ButtonStyles = StyleSheet.create({
  // Base button
  base: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: 44,
  },

  // Primary buttons
  primary: {
    backgroundColor: Colors.primary,
  },
  primaryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },

  // Secondary buttons
  secondary: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },

  // Success buttons
  success: {
    backgroundColor: Colors.success,
  },
  successSecondary: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  successSecondaryText: {
    color: Colors.success,
    fontSize: 16,
    fontWeight: "600",
  },

  // Warning buttons
  warning: {
    backgroundColor: Colors.warning,
  },
  warningSecondary: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  warningText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  warningSecondaryText: {
    color: Colors.warning,
    fontSize: 16,
    fontWeight: "600",
  },

  // Danger buttons
  danger: {
    backgroundColor: Colors.danger,
  },
  dangerSecondary: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  dangerText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  dangerSecondaryText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: "600",
  },

  // Info buttons
  info: {
    backgroundColor: Colors.info,
  },
  infoSecondary: {
    backgroundColor: Colors.infoLight,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  infoText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  infoSecondaryText: {
    color: Colors.info,
    fontSize: 16,
    fontWeight: "600",
  },

  // Outline buttons
  outline: {
    backgroundColor: Colors.white,
    borderWidth: 1,
  },
  outlinePrimary: {
    borderColor: Colors.primary,
  },
  outlineSuccess: {
    borderColor: Colors.success,
  },
  outlineWarning: {
    borderColor: Colors.warning,
  },
  outlineDanger: {
    borderColor: Colors.danger,
  },
  outlineInfo: {
    borderColor: Colors.info,
  },

  // Small buttons
  small: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
  },
  smallText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Large buttons
  large: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    minHeight: 52,
  },
  largeText: {
    fontSize: 18,
    fontWeight: "600",
  },

  // Disabled state
  disabled: {
    opacity: 0.6,
  },
})

// Card styles
export const CardStyles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  small: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  large: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
  },
  flat: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
})

// Layout styles
export const LayoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  contentWithPadding: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  centerVertical: {
    justifyContent: "center",
  },
  centerHorizontal: {
    alignItems: "center",
  },
})

// Input styles
export const InputStyles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  focused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  error: {
    borderColor: Colors.danger,
  },
  disabled: {
    backgroundColor: Colors.lightGray,
    color: Colors.textMuted,
  },
})
