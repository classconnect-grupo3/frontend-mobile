import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './sessionAuth';
import { fetchUserData } from '@/services/userProfile';
import { courseClient } from '@/lib/courseClient';

export interface Course {
  id: string;
  title: string;
  description: string;
  teacher_name: string;
  start_date: string;
  end_date: string;
  capacity: number;
}

interface CoursesContextType {
  courses: Course[];
  addCourse: (course: Course) => void;
  reloadCourses: () => void;
  isLoadingCourses: boolean;
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
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const auth = useAuth();
  if (!auth) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const { authState } = auth;

  const loadCourses = async () => { // why is this not used?
    const teacherId = authState.user?.id;

    if (!teacherId) {
      console.warn('No teacher ID found — skipping course load.');
      setCourses([]); // Prevent null fallback
      return;
    }
  
    console.log('Loading courses for teacher:', teacherId);
  
    try {
      const { data } = await courseClient.get(`/courses/teacher/${teacherId}`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });
  
      console.log('Courses loaded:', data);
      setCourses(data ?? []);
    } catch (e) {
      console.error('Error loading courses:', e);
      setCourses([]);
    }
  };

  const reloadCourses = async () => {
    console.log("AUTH STATE: ", authState);
    const teacherId = authState.user?.id;
    if (!teacherId) {
      console.warn('❌ No teacher ID available to reload courses');
      return;
    }
    console.log('Reloading courses for teacher:', teacherId);
    console.log(`Sending: GET /courses/teacher/${teacherId}`);
    try {
      setIsLoadingCourses(true);
      const { data } = await courseClient.get(`/courses/teacher/${teacherId}`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });
      console.log('Courses reloaded:', data);
      setCourses(data);
      console.log('Courses state updated:', courses);
    } catch (e) {
      console.error('Error reloading courses:', e);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const addCourse = (course: Course) => {
    setCourses((prev) => [...prev, course]);
  };

  useEffect(() => {
    if (!authState.authenticated) {
      console.log('⏳ Auth not ready yet');
      return;
    }
  
    reloadCourses();
  }, [authState.user?.id, authState.token]);

  return (
    <CoursesContext.Provider value={{ courses, addCourse, reloadCourses, isLoadingCourses }}>
      {children}
    </CoursesContext.Provider>
  );
};
