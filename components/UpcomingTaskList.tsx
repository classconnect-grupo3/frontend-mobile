import { View, FlatList } from 'react-native';
import { styles } from '@/styles/homeScreenStyles';
import { UpcomingTaskCard } from './UpcomingTaskCard';

interface Task {
  id: string;
  title: string;
  course_name: string;
  due_date: string;
  course_id: string;
}

interface UpcomingTasksListProps {
  tasks: Task[];
}

export function UpcomingTasksList({ tasks }: UpcomingTasksListProps) {
  return (
    <FlatList
      horizontal
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <UpcomingTaskCard task={item} />}
      contentContainerStyle={styles.horizontalList}
      showsHorizontalScrollIndicator={false}
    />
  );
}
