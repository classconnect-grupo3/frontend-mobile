"use client"

import { useState, useEffect } from "react"
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from "react-native"
import { AntDesign } from "@expo/vector-icons"
import React from "react"

interface Props {
  onSearch: (query: string, tags: string[], status?: "open" | "resolved") => void
  placeholder?: string
  initialQuery?: string
  initialTags?: string[]
  initialStatus?: "open" | "resolved"
}

const AVAILABLE_TAGS = ["general", "teoria", "practica", "necesito-ayuda", "informacion", "ejercitacion", "otro"]
const STATUS_OPTIONS = [
  { value: undefined, label: "Todas" },
  { value: "open" as const, label: "Abiertas" },
  { value: "resolved" as const, label: "Cerradas" },
]

export const ForumSearchBar = ({
  onSearch,
  placeholder = "Buscar...",
  initialQuery = "",
  initialTags = [],
  initialStatus = undefined,
}: Props) => {
  const [query, setQuery] = useState(initialQuery)
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags)
  const [selectedStatus, setSelectedStatus] = useState<"open" | "resolved" | undefined>(initialStatus)
  const [showFilters, setShowFilters] = useState(false)

  // Update local state when initial values change
  useEffect(() => {
    setQuery(initialQuery)
    setSelectedTags(initialTags)
    setSelectedStatus(initialStatus)
  }, [initialQuery, initialTags, initialStatus])

  const handleSearch = () => {
    onSearch(query.trim(), selectedTags, selectedStatus)
  }

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]

    setSelectedTags(newTags)
    // Trigger search immediately when tags change
    onSearch(query.trim(), newTags, selectedStatus)
  }

  const handleStatusChange = (status: "open" | "resolved" | undefined) => {
    setSelectedStatus(status)
    // Trigger search immediately when status changes
    onSearch(query.trim(), selectedTags, status)
  }

  const clearFilters = () => {
    setQuery("")
    setSelectedTags([])
    setSelectedStatus(undefined)
    onSearch("", [], undefined)
  }

  const hasActiveFilters = query.trim() || selectedTags.length > 0 || selectedStatus !== undefined

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <AntDesign name="search1" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            placeholderTextColor="#999"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {hasActiveFilters && (
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
          {hasActiveFilters && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Active Filters Summary */}
      {hasActiveFilters && !showFilters && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Filtros activos: {selectedTags.length > 0 && `${selectedTags.length} etiquetas`}
            {selectedTags.length > 0 && selectedStatus && ", "}
            {selectedStatus && `estado: ${selectedStatus === "open" ? "abiertas" : "cerradas"}`}
            {query.trim() && `, búsqueda: "${query.trim()}"`}
          </Text>
        </View>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Estado de preguntas:</Text>
            <View style={styles.statusContainer}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.statusButton, selectedStatus === option.value && styles.statusButtonSelected]}
                  onPress={() => handleStatusChange(option.value)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      selectedStatus === option.value && styles.statusButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tags Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Etiquetas:</Text>
            <View style={styles.tagsContainer}>
              {AVAILABLE_TAGS.map((tag) => (
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

          {/* Search Button */}
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <AntDesign name="search1" size={16} color="#fff" />
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>
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
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: "#e3f2fd",
  },
  filterIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  activeFiltersContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 6,
  },
  activeFiltersText: {
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "500",
  },
  filtersContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  statusButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  statusButtonText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  statusButtonTextSelected: {
    color: "#fff",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
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
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
})
