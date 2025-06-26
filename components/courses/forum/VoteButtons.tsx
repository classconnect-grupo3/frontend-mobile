import React from "react"
import { View, TouchableOpacity, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface Vote {
  user_id: string
  vote_type: 1 | -1
}

interface VoteButtonsProps {
  votes: Vote[]
  currentUserId?: string
  onVote: (voteType: 1 | -1) => void
  disabled?: boolean
  size?: "small" | "medium" | "large"
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({
  votes,
  currentUserId,
  onVote,
  disabled = false,
  size = "medium",
}) => {
  const upvotes = votes.filter((vote) => vote.vote_type === 1).length
  const downvotes = votes.filter((vote) => vote.vote_type === -1).length
  const netScore = upvotes - downvotes

  const userVote = votes.find((vote) => vote.user_id === currentUserId)
  const hasUpvoted = userVote?.vote_type === 1
  const hasDownvoted = userVote?.vote_type === -1

  const isDisabled = disabled || !currentUserId

  const handleUpvote = () => {
    if (isDisabled) return
    onVote(1)
  }

  const handleDownvote = () => {
    if (isDisabled) return
    onVote(-1)
  }

  const sizeStyles = getSizeStyles(size)

  return (
    <View style={[styles.container, sizeStyles.container]}>
      <TouchableOpacity
        style={[styles.voteButton, sizeStyles.button, hasUpvoted && styles.upvoteActive, isDisabled && styles.disabled]}
        onPress={handleUpvote}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-up"
          size={sizeStyles.iconSize}
          color={hasUpvoted ? "#10B981" : isDisabled ? "#9CA3AF" : "#6B7280"}
        />
        <Text
          style={[
            styles.voteCount,
            sizeStyles.text,
            hasUpvoted && styles.upvoteText,
            isDisabled && styles.disabledText,
          ]}
        >
          {upvotes}
        </Text>
      </TouchableOpacity>

      {size === "large" && (
        <View style={styles.scoreContainer}>
          <Text
            style={[
              styles.netScore,
              sizeStyles.text,
              netScore > 0 && styles.positiveScore,
              netScore < 0 && styles.negativeScore,
            ]}
          >
            {netScore > 0 ? `+${netScore}` : netScore}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.voteButton,
          sizeStyles.button,
          hasDownvoted && styles.downvoteActive,
          isDisabled && styles.disabled,
        ]}
        onPress={handleDownvote}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-down"
          size={sizeStyles.iconSize}
          color={hasDownvoted ? "#EF4444" : isDisabled ? "#9CA3AF" : "#6B7280"}
        />
        <Text
          style={[
            styles.voteCount,
            sizeStyles.text,
            hasDownvoted && styles.downvoteText,
            isDisabled && styles.disabledText,
          ]}
        >
          {downvotes}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const getSizeStyles = (size: "small" | "medium" | "large") => {
  switch (size) {
    case "small":
      return {
        container: { gap: 4 },
        button: { paddingHorizontal: 6, paddingVertical: 2, minWidth: 32 },
        iconSize: 14,
        text: { fontSize: 11 },
      }
    case "large":
      return {
        container: { gap: 8 },
        button: { paddingHorizontal: 12, paddingVertical: 6, minWidth: 48 },
        iconSize: 20,
        text: { fontSize: 14 },
      }
    default: // medium
      return {
        container: { gap: 6 },
        button: { paddingHorizontal: 8, paddingVertical: 4, minWidth: 40 },
        iconSize: 16,
        text: { fontSize: 12 },
      }
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 2,
  },
  voteCount: {
    fontWeight: "600",
    color: "#6B7280",
  },
  upvoteActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  downvoteActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
  },
  upvoteText: {
    color: "#10B981",
  },
  downvoteText: {
    color: "#EF4444",
  },
  disabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    opacity: 0.6,
  },
  disabledText: {
    color: "#9CA3AF",
  },
  scoreContainer: {
    paddingHorizontal: 8,
  },
  netScore: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B7280",
  },
  positiveScore: {
    color: "#10B981",
  },
  negativeScore: {
    color: "#EF4444",
  },
})
