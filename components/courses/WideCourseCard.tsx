import { Course } from '@/contexts/CoursesContext';
import React from 'react';
import { styles } from '@/styles/courseStyles';
import { BaseCourseCard } from './BaseCourseCard';

interface Props {
  course: Course;
  onPress?: () => void;
}

export function WideCourseCard({ course, onPress }: Props) {
  return (
    <BaseCourseCard
      course={course}
      cardStyle={styles.wideCard}
      onPress={onPress}
    />
  );
}
