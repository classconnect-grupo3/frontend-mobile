import React from "react"
import { TouchableOpacity, Text, type ViewStyle, type TextStyle, ActivityIndicator } from "react-native"
import { ButtonStyles, Colors } from "@/styles/shared"

type ButtonVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "outline"
type ButtonSize = "small" | "medium" | "large"

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  icon?: React.ReactNode
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const getButtonStyle = () => {
    const baseStyles = [ButtonStyles.base]

    // Size styles
    if (size === "small") baseStyles.push(ButtonStyles.small)
    if (size === "large") baseStyles.push(ButtonStyles.large)

    // Variant styles
    switch (variant) {
      case "primary":
        baseStyles.push(ButtonStyles.primary)
        break
      case "secondary":
        baseStyles.push(ButtonStyles.secondary)
        break
      case "success":
        baseStyles.push(ButtonStyles.success)
        break
      case "warning":
        baseStyles.push(ButtonStyles.warning)
        break
      case "danger":
        baseStyles.push(ButtonStyles.danger)
        break
      case "info":
        baseStyles.push(ButtonStyles.info)
        break
      case "outline":
        baseStyles.push(ButtonStyles.outline, ButtonStyles.outlinePrimary)
        break
    }

    // Disabled state
    if (disabled || loading) {
      baseStyles.push(ButtonStyles.disabled)
    }

    return baseStyles
  }

  const getTextStyle = () => {
    const baseStyles = []

    // Size text styles
    if (size === "small") baseStyles.push(ButtonStyles.smallText)
    else if (size === "large") baseStyles.push(ButtonStyles.largeText)
    else baseStyles.push(ButtonStyles.primaryText)

    // Variant text styles
    switch (variant) {
      case "primary":
        baseStyles.push(ButtonStyles.primaryText)
        break
      case "secondary":
        baseStyles.push(ButtonStyles.secondaryText)
        break
      case "success":
        baseStyles.push(ButtonStyles.successText)
        break
      case "warning":
        baseStyles.push(ButtonStyles.warningText)
        break
      case "danger":
        baseStyles.push(ButtonStyles.dangerText)
        break
      case "info":
        baseStyles.push(ButtonStyles.infoText)
        break
      case "outline":
        baseStyles.push({ color: Colors.primary })
        break
    }

    return baseStyles
  }

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "secondary" || variant === "outline" ? Colors.primary : Colors.white}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[...getTextStyle(), textStyle, icon && { marginLeft: 8 }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

// Specialized button components for common use cases
export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="primary" />
}

export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="secondary" />
}

export function SuccessButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="success" />
}

export function WarningButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="warning" />
}

export function DangerButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="danger" />
}

export function InfoButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="info" />
}

export function OutlineButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="outline" />
}
