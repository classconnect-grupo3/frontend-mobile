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

const MOCK_COURSES = [
    { id: '1', title: 'TDA', teacher: 'Iñaki Llorens', due: 'TP1: Prog Dinamica' },
    { id: '2', title: 'Redes', teacher: 'Iñaki Llorens', due: 'Leer hasta 5.4' },
    { id: '3', title: 'Taller 1', teacher: 'Iñaki Llorens', due: 'TP Individual' },
    { id: '4', title: 'Taller 2', teacher: 'Iñaki Llorens', due: 'TP1: Prog Dinamica' },
    { id: '5', title: 'Taller de Ciberseguridad y Criptografia', teacher: 'Iñaki Llorens', due: 'Leer hasta 5.4' },
    { id: '6', title: 'Organización de Datos', teacher: 'Iñaki Llorens', due: 'TP Individual' },
];

const COURSES_PER_PAGE = 4;

export default function MyCoursesScreen() {
    const [page, setPage] = useState(1);

    const totalPages = Math.ceil(MOCK_COURSES.length / COURSES_PER_PAGE);
    const start = (page - 1) * COURSES_PER_PAGE;
    const end = start + COURSES_PER_PAGE;
    const paginatedCourses = MOCK_COURSES.slice(start, end);

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Image
                    source={require('@/assets/images/logo.png')}
                    style={styles.logo}
                />
                <TouchableOpacity onPress={() => { router.push('/profile') }}>
                    <Image
                        source={require('@/assets/images/tuntungsahur.jpeg')}
                        style={styles.profileIcon}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <VerticalCourseList courses={paginatedCourses} />
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
                </View>
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    pageButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 6,
    },
    pageButtonText: {
        color: 'white',
    },
    pageIndicator: {
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
});
