import { View, FlatList } from 'react-native';
import { styles } from '@/styles/homeScreenStyles';
import { WideCourseCard } from './WideCourseCard';

interface Course {
    id: string;
    title: string;
    teacher: string;
    due: string;
}

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