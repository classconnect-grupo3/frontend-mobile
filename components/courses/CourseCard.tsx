import React from 'react';
import { styles } from '@/styles/courseStyles';
import { Course } from '@/contexts/CoursesContext';
import { BaseCourseCard } from './BaseCourseCard';

interface Props {
  course: Course;
}

export function CourseCard({ course }: Props) {
  return <BaseCourseCard course={course} cardStyle={styles.card} />;
}
