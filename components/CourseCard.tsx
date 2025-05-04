import { View, Text, Image, StyleSheet } from 'react-native';

interface Course {
  id: string;
  title: string;
  teacher: string;
  due: string;
}

interface Props {
  course: Course;
}

export function CourseCard({ course }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.teacher}>{course.teacher}</Text>
        </View>
        <Image
          source={require('@/assets/images/profile-placeholder.jpeg')}
          style={styles.avatar}
        />
      </View>
      <Text style={styles.due}>Next: {course.due}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  teacher: {
    fontSize: 14,
    color: '#555',
  },
  due: {
    fontSize: 13,
    color: '#888',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ccc',
  },
});
