import { View, Text, StyleSheet } from 'react-native';

interface Task {
    id: string;
    title: string;
    due_date: string;
    course_name: string;
    course_id: string;
};

interface Props {
    task: Task;
}

export function UpcomingTaskCard({ task }: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.name}>{task.title}</Text>
            <Text style={styles.course}>{task.course_name}</Text>
            <Text style={styles.due}>Due: {task.due_date}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 200,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    name: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    course: {
        fontSize: 14,
        marginVertical: 4,
    },
    due: {
        fontSize: 12,
        color: 'gray',
    },
});
