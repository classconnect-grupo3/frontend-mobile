import { createContext, useContext, useState } from 'react';

export interface Course {
  id: string;
  title: string;
  teacher: string;
  due?: string;
  description?: string;
  capacity?: number;
  eligibility?: string;
}

interface CoursesContextType {
  courses: Course[];
  addCourse: (course: Course) => void;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

const MOCK_COURSES = [
    { id: '1', title: 'TDA', teacher: 'Iñaki Llorens', due: 'TP1: Prog Dinamica' },
    { id: '2', title: 'Redes', teacher: 'Iñaki Llorens', due: 'Leer hasta 5.4' },
    { id: '3', title: 'Taller 1', teacher: 'Iñaki Llorens', due: 'TP Individual' },
    { id: '4', title: 'Taller 2', teacher: 'Iñaki Llorens', due: 'TP1: Prog Dinamica' },
    { id: '5', title: 'Taller de Ciberseguridad y Criptografia', teacher: 'Iñaki Llorens', due: 'Leer hasta 5.4' },
    { id: '6', title: 'Organización de Datos', teacher: 'Iñaki Llorens', due: 'TP Individual' },
];

export const useCourses = () => {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useCourses must be used within a CoursesProvider');
  }
  return context;
};

export const CoursesProvider = ({ children }: { children: React.ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);

  const addCourse = (course: Course) => {
    setCourses((prev) => [...prev, course]);
  };

  return (
    <CoursesContext.Provider value={{ courses, addCourse }}>
      {children}
    </CoursesContext.Provider>
  );
};
