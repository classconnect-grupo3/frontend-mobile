import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: 16,
  },
});
export function CenteredView({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.centered, style]}>{children}</View>;
}
