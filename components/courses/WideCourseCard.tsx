import { Course } from '@/contexts/CoursesContext';
import React from 'react';
import { styles } from '@/styles/courseStyles';
import { BaseCourseCard } from './BaseCourseCard';

interface Props {
  course: Course;
}

export function WideCourseCard({ course }: Props) {
  return <BaseCourseCard course={course} cardStyle={styles.wideCard} />;
}
