import { VerticalCourseList } from '@/components/courses/VerticalCourseList';
import { styles } from '@/styles/homeScreenStyles';
import { styles as paginationStyles } from '@/styles/paginationStyles';
import { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useRouter } from 'expo-router';
import {
    Button,
    Image,
    Modal,
} from 'react-native';
import { UpcomingTasksList } from '@/components/UpcomingTaskList';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { useCourses } from '@/contexts/CoursesContext';
import Header from '@/components/Header';
import { CreateCourseModal } from '@/components/courses/CreateCourseModal';
import { fetchUserData } from '@/services/userProfile';
import { useAuth } from '@/contexts/sessionAuth';

const COURSES_PER_PAGE = 4;

export default function MyCoursesScreen() {
    const [page, setPage] = useState(1);
    const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
    const { courses, reloadCourses, isLoadingCourses } = useCourses();

    const totalPages = Math.ceil(courses?.length ?? 0 / COURSES_PER_PAGE);
    const start = (page - 1) * COURSES_PER_PAGE;
    const end = start + COURSES_PER_PAGE;
    const paginatedCourses = courses?.slice(start, end) ?? [];

    useEffect(() => {
        reloadCourses();
    }, []);

    return (
        <View style={styles.container}>
            <Header/>

            {isLoadingCourses ? (
                <ActivityIndicator size="large" style={{ marginTop: 40 }} />
                ) : (
                <VerticalCourseList courses={paginatedCourses} />
                )}

            <View style={styles.content}>
                <VerticalCourseList courses={paginatedCourses.map(course => ({
                    ...course,
                }))} />
                <View style={paginationStyles.paginationContainer}>
                    <TouchableOpacity
                        onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        style={[paginationStyles.pageButton, page === 1 && paginationStyles.disabledButton]}
                    >
                        <Text style={paginationStyles.pageButtonText}>Previous</Text>
                    </TouchableOpacity>

                    <Text style={paginationStyles.pageIndicator}>
                        Page {page} of {totalPages}
                    </Text>

                    <TouchableOpacity
                        onPress={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        style={[paginationStyles.pageButton, page === totalPages && paginationStyles.disabledButton]}
                    >
                        <Text style={paginationStyles.pageButtonText}>Next</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowCreateCourseModal(true)}
                        style={localStyles.createCourseButton}
                    >
                        <MaterialCommunityIcons name="book-plus-multiple" size={28} color='white' />
                    </TouchableOpacity>
                    <CreateCourseModal 
                        visible={showCreateCourseModal} 
                        onClose={() => setShowCreateCourseModal(false)} 
                    />
                </View>
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
    createCourseButton: {
        margin: 6,
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 6,
    }
});
