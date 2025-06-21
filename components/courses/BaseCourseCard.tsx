import { Course } from "@/contexts/CoursesContext";
import { router } from "expo-router";
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { styles as courseStyles } from '@/styles/courseStyles';
import React from "react";
import { useAuth } from "@/contexts/sessionAuth";
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from "@/styles/shared";

interface BaseProps {
  course: Course;
  cardStyle: object;
  onPress?: () => void;
}

export function BaseCourseCard({ course, cardStyle, onPress }: BaseProps) {
  const handlePress = onPress ?? (() => router.push(`/course/${course.id}`));
  const auth = useAuth();
  const profileImageUrl = auth?.authState.user?.profilePicUrl;
      

  return (
    <TouchableOpacity onPress={handlePress} style={cardStyle}>
      <View style={styles.header}>
        <Text style={styles.title}>{course.title}</Text>
        <View style={styles.row}>
          <Feather name="user" size={16} color={Colors.primary} />
          <Text style={styles.text}>Teacher: {course.teacher_name}</Text>
        </View>
        {course.description && (
          <View style={styles.row}>
            <Feather name="info" size={16} color={Colors.primary}/>
            <Text style={styles.text}>{course.description}</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.row}>
          <Feather name="calendar" size={16} color={Colors.primary} />
          <Text style={styles.text}>
            {new Date(course.start_date).toLocaleDateString()} → {new Date(course.end_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.row}>
          <MaterialCommunityIcons name="account-group" size={18} color={Colors.primary} />
          <Text style={styles.text}>Cupos: {course.capacity}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  text: {
    marginLeft: 6,
    color: '#555',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  details: {
    marginTop: 4,
  },
});