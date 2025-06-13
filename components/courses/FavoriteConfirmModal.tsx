import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import React from "react"

interface FavoriteConfirmModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
  courseTitle: string
  isRemoving?: boolean
}

export function FavoriteConfirmModal({
  visible,
  onClose,
  onConfirm,
  courseTitle,
  isRemoving = false,
}: FavoriteConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name={isRemoving ? "star-border" : "star"}
              size={40}
              color={isRemoving ? "#666" : "#FFD700"}
            />
          </View>

          <Text style={styles.title}>{isRemoving ? "¿Quitar de favoritos?" : "¿Añadir a favoritos?"}</Text>

          <Text style={styles.message}>
            {isRemoving
              ? `¿Estás seguro que deseas quitar "${courseTitle}" de tus cursos favoritos?`
              : `¿Deseas añadir "${courseTitle}" a tus cursos favoritos para acceder más rápidamente?`}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.confirmButton, isRemoving && styles.removeButton]} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{isRemoving ? "Quitar" : "Añadir"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  confirmButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  removeButton: {
    backgroundColor: "#FF3B30",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
})
