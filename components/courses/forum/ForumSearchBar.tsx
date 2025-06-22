"use client"

import { useState } from "react"
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from "react-native"
import { AntDesign } from "@expo/vector-icons"
import React from "react"

interface Props {
  onSearch: (query: string, tags: string[]) => void
  placeholder?: string
}

const QUICK_FILTERS = ["general", "tarea", "examen", "duda", "urgente"]

export const ForumSearchBar = ({ onSearch, placeholder = "Buscar..." }: Props) => {
  const [query, setQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = () => {
    onSearch(query, selectedTags)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      // Auto-search when tags change
      setTimeout(() => onSearch(query, newTags), 100)
      return newTags
    })
  }

  const clearFilters = () => {
    setQuery("")
    setSelectedTags([])
    onSearch("", [])
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <AntDesign name="search1" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {(query || selectedTags.length > 0) && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
              <AntDesign name="close" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <AntDesign name="filter" size={16} color={showFilters ? "#007AFF" : "#666"} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filtros rápidos:</Text>
          <View style={styles.tagsContainer}>
            {QUICK_FILTERS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selectedTags.includes(tag) && styles.selectedTag]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.selectedTagText]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#e3f2fd",
  },
  filtersContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  filtersTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedTag: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  tagText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  selectedTagText: {
    color: "#fff",
  },
})
