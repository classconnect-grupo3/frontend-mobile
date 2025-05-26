import { VerticalCourseList } from '@/components/courses/VerticalCourseList';
import { styles } from '@/styles/homeScreenStyles';
import { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { router, useRouter } from 'expo-router';
import {
    Button,
    Image,
    Modal,
} from 'react-native';
import { UpcomingTasksList } from '@/components/UpcomingTaskList';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Course, useCourses } from '@/contexts/CoursesContext';
import Header from '@/components/Header';
import { CreateCourseModal } from '@/components/courses/CreateCourseModal';
import { fetchUserData } from '@/services/userProfile';
import { useAuth } from '@/contexts/sessionAuth';
import { WideCourseCard } from '@/components/courses/WideCourseCard';

export default function MyCoursesScreen() {
    const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
    const { courses, reloadCourses, isLoadingCourses } = useCourses();

    const teachingCourses = courses.filter(c => c.role === 'teacher');
    const enrolledCourses = courses.filter(c => c.role === 'student');

    useEffect(() => {
        reloadCourses();
    }, []);

    return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={localStyles.scrollContent}>
        <Text style={styles.title}>Courses in which I teach</Text>
        {isLoadingCourses ? (
          <ActivityIndicator size="large" style={{ marginVertical: 24 }} />
        ) : teachingCourses.length === 0 ? (
          <Text style={styles.emptyText}>No courses found.</Text>
        ) : (
          teachingCourses.map(course => (
            <WideCourseCard key={course.id} course={course} />
          ))
        )}

        <Text style={[styles.title, { marginTop: 32 }]}>Courses which I attend</Text>
        {enrolledCourses.length === 0 ? (
          <Text style={styles.emptyText}>You are not enrolled in any courses.</Text>
        ) : (
          enrolledCourses.map(course => (
            <WideCourseCard
              key={course.id}
              course={course}
              onPress={() => router.push(`/course/${course.id}/student`)}
            />
          ))
        )}
      </ScrollView>

      <View style={localStyles.addButtonWrapper}>
          <TouchableOpacity
            onPress={() => setShowCreateCourseModal(true)}
            style={localStyles.createCourseButton}
          >
            <MaterialCommunityIcons name="book-plus-multiple" size={28} color="white" />
          </TouchableOpacity>
        </View>

      <CreateCourseModal
        visible={showCreateCourseModal}
        onClose={() => setShowCreateCourseModal(false)}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    addButtonWrapper: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 10,
    },
    createCourseButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5,
    },
});
