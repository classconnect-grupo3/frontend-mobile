"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { AntDesign } from "@expo/vector-icons"
import React from "react"

interface DateRange {
  from: Date
  to: Date
}

interface Props {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export const DateRangePicker = ({ dateRange, onDateRangeChange }: Props) => {
  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleFromDateChange = (event: any, selectedDate?: Date) => {
    setShowFromPicker(Platform.OS === "ios")
    if (selectedDate) {
      const newRange = { ...dateRange, from: selectedDate }
      // Ensure 'from' is not after 'to'
      if (selectedDate > dateRange.to) {
        newRange.to = selectedDate
      }
      onDateRangeChange(newRange)
    }
  }

  const handleToDateChange = (event: any, selectedDate?: Date) => {
    setShowToPicker(Platform.OS === "ios")
    if (selectedDate) {
      const newRange = { ...dateRange, to: selectedDate }
      // Ensure 'to' is not before 'from'
      if (selectedDate < dateRange.from) {
        newRange.from = selectedDate
      }
      onDateRangeChange(newRange)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filtrar por período</Text>

      <View style={styles.dateRow}>
        <View style={styles.dateSection}>
          <Text style={styles.label}>Desde</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowFromPicker(true)}>
            <AntDesign name="calendar" size={16} color="#007AFF" />
            <Text style={styles.dateText}>{formatDate(dateRange.from)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateSection}>
          <Text style={styles.label}>Hasta</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowToPicker(true)}>
            <AntDesign name="calendar" size={16} color="#007AFF" />
            <Text style={styles.dateText}>{formatDate(dateRange.to)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* From Date Picker */}
      {showFromPicker && (
        <DateTimePicker
          value={dateRange.from}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleFromDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* To Date Picker */}
      {showToPicker && (
        <DateTimePicker
          value={dateRange.to}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleToDateChange}
          maximumDate={new Date()}
          minimumDate={dateRange.from}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateSection: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
})
