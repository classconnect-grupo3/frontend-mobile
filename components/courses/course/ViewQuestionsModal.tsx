import React from "react"
import { Modal, View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "react-native"
import { AntDesign } from "@expo/vector-icons"
import type { Assignment, Question } from "@/app/course/[id]/CourseViewScreen"

interface Props {
  visible: boolean
  assignment: Assignment | null
  onClose: () => void
  onAddQuestions: () => void
}

export const ViewQuestionsModal = ({ visible, assignment, onClose, onAddQuestions }: Props) => {
  if (!assignment) return null

  const renderQuestion = (question: Question, index: number) => {
    return (
      <View key={question.id} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Question {index + 1}</Text>
          <Text style={styles.questionPoints}>{question.points} pts</Text>
        </View>

        <Text style={styles.questionText}>{question.text}</Text>

        <View style={styles.questionTypeContainer}>
          <Text style={styles.questionType}>
            Type:{" "}
            {question.type === "multiple_choice"
              ? "Multiple Choice"
              : question.type === "file"
                ? "File Upload"
                : "Text"}
          </Text>
        </View>

        {question.type === "multiple_choice" && question.options && (
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>Options:</Text>
            {question.options.map((option, optionIndex) => {
              const isCorrect = question.correct_answers?.includes(option)
              return (
                <View key={optionIndex} style={styles.optionRow}>
                  <Text style={[styles.optionText, isCorrect && styles.correctOption]}>
                    {String.fromCharCode(65 + optionIndex)}. {option}
                    {isCorrect && " ✓"}
                  </Text>
                </View>
              )
            })}
          </View>
        )}
      </View>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <AntDesign name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Questions - {assignment.title}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {assignment.questions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No questions added yet</Text>
              <Text style={styles.emptyStateSubtext}>Add questions to this exam to get started</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>Total Questions: {assignment.questions.length}</Text>
                <Text style={styles.summaryText}>
                  Total Points: {assignment.questions.reduce((sum, q) => sum + q.points, 0)}
                </Text>
              </View>

              {assignment.questions
                .sort((a, b) => a.order - b.order)
                .map((question, index) => renderQuestion(question, index))}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.addQuestionsButton} onPress={onAddQuestions}>
            <Text style={styles.addQuestionsButtonText}>+ Add Questions</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#333",
    flex: 1,
    textAlign: "center" as const,
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#666",
  },
  questionCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  questionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 10,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#333",
  },
  questionPoints: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#007AFF",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
    lineHeight: 22,
  },
  questionTypeContainer: {
    marginBottom: 10,
  },
  questionType: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase" as const,
    fontWeight: "500" as const,
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#333",
    marginBottom: 8,
  },
  optionRow: {
    marginBottom: 5,
  },
  optionText: {
    fontSize: 14,
    color: "#666",
    paddingLeft: 10,
  },
  correctOption: {
    color: "#4CAF50",
    fontWeight: "500" as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "500" as const,
    color: "#666",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center" as const,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  addQuestionsButton: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#2196F3",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center" as const,
  },
  addQuestionsButtonText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "600" as const,
  },
}
