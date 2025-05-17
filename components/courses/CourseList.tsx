import { View, FlatList } from 'react-native';
import { styles } from '@/styles/homeScreenStyles';
import { CourseCard } from './CourseCard';
import { Course } from '@/contexts/CoursesContext';
import React from 'react';

interface CourseListProps {
  courses: Course[];
}

export function CourseList({ courses }: CourseListProps) {
  return (
    <FlatList
      horizontal
      data={courses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CourseCard course={item} />}
      contentContainerStyle={styles.horizontalList}
      showsHorizontalScrollIndicator={false}
    />
  );
}
