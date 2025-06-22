import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { AntDesign, MaterialIcons } from "@expo/vector-icons"
import type { ForumQuestion, UserRole } from "@/types/forum"
import React from "react"

interface Props {
  question: ForumQuestion
  userRole?: UserRole
  onPress: () => void
  onVote: (voteType: 1 | -1) => void
  currentUserId?: string
}

export const QuestionCard = ({ question, userRole, onPress, onVote, currentUserId }: Props) => {
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
  const isOwnQuestion = currentUserId === question.author_id

  return (
    <TouchableOpacity style={[styles.container, isOwnQuestion && styles.ownQuestion]} onPress={onPress}>
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
        <Text style={styles.date}>
          {new Date(question.created_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          })}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {question.title}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {question.description}
      </Text>

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {question.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {question.tags.length > 3 && <Text style={styles.moreTags}>+{question.tags.length - 3} más</Text>}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <MaterialIcons name="question-answer" size={16} color="#666" />
            <Text style={styles.statText}>{question.answer_count}</Text>
          </View>
          {question.accepted_answer_id && (
            <View style={styles.acceptedBadge}>
              <AntDesign name="checkcircle" size={14} color="#4CAF50" />
              <Text style={styles.acceptedText}>Resuelta</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: question.status === "open" ? "#e8f5e8" : "#ffeaea" }]}>
            <Text style={[styles.statusText, { color: question.status === "open" ? "#2e7d32" : "#d32f2f" }]}>
              {question.status === "open" ? "Abierta" : "Cerrada"}
            </Text>
          </View>
        </View>

        <View style={styles.voteContainer}>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={(e) => {
              e.stopPropagation()
              onVote(1)
            }}
            disabled={!currentUserId}
          >
            <AntDesign name="up" size={16} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.voteCount}>{question.vote_count}</Text>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={(e) => {
              e.stopPropagation()
              onVote(-1)
            }}
            disabled={!currentUserId}
          >
            <AntDesign name="down" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#e0e0e0",
  },
  ownQuestion: {
    borderLeftColor: "#007AFF",
    backgroundColor: "#f8fbff",
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
  date: {
    fontSize: 12,
    color: "#666",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    lineHeight: 20,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    alignItems: "center",
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  moreTags: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  acceptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  acceptedText: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
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
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: "center",
  },
})
