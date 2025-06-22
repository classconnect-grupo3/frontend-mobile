import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { AntDesign, MaterialIcons } from "@expo/vector-icons"
import type { ForumAnswer, UserRole } from "@/types/forum"
import React from "react"

interface Props {
  answer: ForumAnswer
  userRole?: UserRole
  onVote: (voteType: 1 | -1) => void
  onAccept: () => void
  onDelete: () => void
  onEdit: () => void
  canAccept: boolean
  canDelete: boolean
  currentUserId?: string
  isAccepted: boolean
}

export const AnswerCard = ({
  answer,
  userRole,
  onVote,
  onAccept,
  onDelete,
  onEdit,
  canAccept,
  canDelete,
  currentUserId,
  isAccepted,
}: Props) => {
  const getRoleBadge = (role: "teacher" | "aux_teacher" | "student") => {
    switch (role) {
      case "teacher":
        return { text: "Docente", color: "#4CAF50", bgColor: "#e8f5e8" }
      case "aux_teacher":
        return { text: "Aux. Docente", color: "#FF9800", bgColor: "#fff3e0" }
      case "student":
        return { text: "Estudiante", color: "#2196F3", bgColor: "#e3f2fd" }
    }
  }

  const roleBadge = userRole ? getRoleBadge(userRole.role) : null
  const isOwnAnswer = currentUserId === answer.author_id

  const handleDelete = () => {
    Alert.alert("Eliminar respuesta", "¿Estás seguro de que quieres eliminar esta respuesta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: onDelete },
    ])
  }

  return (
    <View style={[styles.container, isAccepted && styles.acceptedContainer, isOwnAnswer && styles.ownAnswer]}>
      {isAccepted && (
        <View style={styles.acceptedBanner}>
          <AntDesign name="checkcircle" size={16} color="#4CAF50" />
          <Text style={styles.acceptedText}>Respuesta Aceptada</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userRole ? `${userRole.name.charAt(0)}${userRole.surname.charAt(0)}` : "?"}
            </Text>
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>
              {userRole ? `${userRole.name} ${userRole.surname}` : "Usuario desconocido"}
            </Text>
            {roleBadge && (
              <View style={[styles.roleBadge, { backgroundColor: roleBadge.bgColor }]}>
                <Text style={[styles.roleBadgeText, { color: roleBadge.color }]}>{roleBadge.text}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <Text style={styles.date}>
            {new Date(answer.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {isOwnAnswer && (
            <TouchableOpacity onPress={onEdit} style={styles.editButton}>
              <MaterialIcons name="edit" size={16} color="#666" />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <MaterialIcons name="delete" size={16} color="#f44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.content}>{answer.content}</Text>

      <View style={styles.footer}>
        <View style={styles.voteContainer}>
          <TouchableOpacity style={styles.voteButton} onPress={() => onVote(1)} disabled={!currentUserId}>
            <AntDesign name="up" size={18} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.voteCount}>{answer.vote_count}</Text>
          <TouchableOpacity style={styles.voteButton} onPress={() => onVote(-1)} disabled={!currentUserId}>
            <AntDesign name="down" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {canAccept && !isAccepted && (
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <AntDesign name="checkcircle" size={16} color="#4CAF50" />
            <Text style={styles.acceptButtonText}>Aceptar como solución</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#e0e0e0",
  },
  acceptedContainer: {
    borderLeftColor: "#4CAF50",
    backgroundColor: "#f8fff8",
  },
  ownAnswer: {
    borderLeftColor: "#007AFF",
    backgroundColor: "#f8fbff",
  },
  acceptedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  acceptedText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1976d2",
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  headerActions: {
    alignItems: "flex-end",
  },
  date: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  deleteButton: {
    padding: 4,
  },
  content: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voteContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  voteButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: "#f5f5f5",
  },
  voteCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: "center",
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  editButton: {
    padding: 4,
    marginRight: 4,
  },
})
