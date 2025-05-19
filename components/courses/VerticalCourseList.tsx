import { View, FlatList } from 'react-native';
import { styles } from '@/styles/homeScreenStyles';
import { WideCourseCard } from './WideCourseCard';
import React from 'react';
import { Course } from '@/contexts/CoursesContext';

interface CourseListProps {
    courses: Course[];
}

export function VerticalCourseList({ courses }: CourseListProps) {
    return (
        <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <WideCourseCard course={item} />}
            contentContainerStyle={styles.verticalList}
        />
    );
}
