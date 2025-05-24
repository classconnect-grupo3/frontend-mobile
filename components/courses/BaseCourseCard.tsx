import { Course } from "@/contexts/CoursesContext";
import { router } from "expo-router";
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { styles } from '@/styles/courseStyles';
import React from "react";

interface BaseProps {
  course: Course;
  cardStyle: object;
}

export function BaseCourseCard({ course, cardStyle }: BaseProps) {
  return (
    <TouchableOpacity onPress={() => router.push(`/course/${course.id}`)}>
      <View style={cardStyle}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.title}>{course.title}</Text>
            <Text style={styles.teacher}>Teacher: {course.teacher_name}</Text>
            <Text style={styles.teacher}>{course.description}</Text>
          </View>
          <Image
            source={require('@/assets/images/profile-placeholder.jpeg')}
            style={styles.avatar}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.due}>
            Starting date: {new Date(course.start_date).toLocaleDateString()}
          </Text>
          <Text style={styles.due}>
            End date: {new Date(course.end_date).toLocaleDateString()}
          </Text>
          <Text style={styles.due}>
            Capacity: {course.capacity}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
