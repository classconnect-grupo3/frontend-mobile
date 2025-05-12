import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './sessionAuth';
import { fetchUserData } from '@/services/userProfile';
import { courseClient } from '@/lib/courseClient';

export interface Course {
  id: string;
  title: string;
  description?: string;
  teacher: string;
  startingDate: string;
  endDate: string;
  capacity?: number;
}

interface CoursesContextType {
  courses: Course[];
  addCourse: (course: Course) => void;
  reloadCourses: () => void;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export const useCourses = () => {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useCourses must be used within a CoursesProvider');
  }
  return context;
};

export const CoursesProvider = ({ children }: { children: React.ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const { authState } = useAuth();

  const loadCourses = async (teacherId: string) => {
    console.log('Loading courses for teacher:', teacherId);
    try {
      const { data } = await courseClient.get(`/courses/teacher/${teacherId}`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });

      console.log('Courses loaded:', data);
      setCourses(data);
    } catch (e) {
      console.error('Error loading courses:', e);
    }
  };

  const addCourse = (course: Course) => {
    setCourses((prev) => [...prev, course]);
  };

  useEffect(() => {
    console.log('Loading courses for user:', authState.user);
    if (!authState.user) return;

    if (authState.user?.id && authState.token) {
      loadCourses(authState.user.id);
    }
  }, [authState.user?.id]);

  return (
    <CoursesContext.Provider value={{ courses, addCourse, reloadCourses: loadCourses }}>
      {children}
    </CoursesContext.Provider>
  );
};
