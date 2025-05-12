import { Course } from '@/contexts/CoursesContext';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  course: Course;
}

export function WideCourseCard({ course }: Props) {
  return (
    <TouchableOpacity onPress={() => router.push(`/course/${course.id}`)}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.title}>{course.title}</Text>
            <Text style={styles.teacher}>{course.teacher}</Text>
          </View>
          <Image
            source={require('@/assets/images/profile-placeholder.jpeg')}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.due}>Starting date: {course.startingDate}</Text>
        <Text style={styles.due}>End date: {course.endDate}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 120,
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  teacher: {
    fontSize: 14,
    color: '#555',
  },
  due: {
    fontSize: 13,
    color: '#888',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ccc',
  },
});
