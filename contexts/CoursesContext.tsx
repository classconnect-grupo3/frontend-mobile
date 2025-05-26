import { createContext, useContext, useEffect, useState } from 'react';
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
  role: 'teacher' | 'student';
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
  const { authState } = useAuth();

  const reloadCourses = async () => {
    const userId = authState.user?.id;
    if (!userId) {
      console.warn('❌ No user ID available to reload courses');
      return;
    }

    try {
      setIsLoadingCourses(true);

      const { data } = await courseClient.get(`/courses/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });

      console.log('Courses from API:', data);

      const teacherCourses = data.teacher.map((c: any) => ({
        ...c,
        role: 'teacher',
      }));

      const studentCourses = data.student.map((c: any) => ({
        ...c,
        role: 'student',
      }));

      const allCourses = [...teacherCourses, ...studentCourses];

      setCourses(allCourses);
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
    console.log('Loading courses for user:', authState.user);
    if (!authState.user) return;

    if (authState.user?.id && authState.token) {
      reloadCourses();
    }
  }, [authState.user?.id]);

  return (
    <CoursesContext.Provider value={{ courses, addCourse, reloadCourses, isLoadingCourses }}>
      {children}
    </CoursesContext.Provider>
  );
};
