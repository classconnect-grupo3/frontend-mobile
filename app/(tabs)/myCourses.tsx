import { VerticalCourseList } from '@/components/VerticalCourseList';
import { styles } from '@/styles/homeScreenStyles';
import { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
import { CreateCourseModal } from '@/components/CreateCourseModal';
import { fetchUserData } from '@/services/userProfile';
import { useAuth } from '@/contexts/sessionAuth';

const COURSES_PER_PAGE = 4;

export default function MyCoursesScreen() {
    const [page, setPage] = useState(1);
    const {courses, addCourse} = useCourses();
    const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
    const { reloadCourses } = useCourses();

    const totalPages = Math.ceil(courses?.length ?? 0 / COURSES_PER_PAGE);
    const start = (page - 1) * COURSES_PER_PAGE;
    const end = start + COURSES_PER_PAGE;
    const paginatedCourses = courses?.slice(start, end) ?? [];

    // useEffect(() => {
    //     reloadCourses();
    // }, []);

    return (
        <View style={styles.container}>
            <Header/>

            <View style={styles.content}>
                <VerticalCourseList courses={paginatedCourses.map(course => ({
                    ...course,
                }))} />
                <View style={localStyles.paginationContainer}>
                    <TouchableOpacity
                        onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        style={[localStyles.pageButton, page === 1 && localStyles.disabledButton]}
                    >
                        <Text style={localStyles.pageButtonText}>Previous</Text>
                    </TouchableOpacity>

                    <Text style={localStyles.pageIndicator}>
                        Page {page} of {totalPages}
                    </Text>

                    <TouchableOpacity
                        onPress={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        style={[localStyles.pageButton, page === totalPages && localStyles.disabledButton]}
                    >
                        <Text style={localStyles.pageButtonText}>Next</Text>
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
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 12,
    },
    pageButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 6,
        margin: 4,
    },
    pageButtonText: {
        color: 'white',
    },
    pageIndicator: {
        margin: 4,
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    createCourseButton: {
        margin: 6,
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 6,
    }
});
