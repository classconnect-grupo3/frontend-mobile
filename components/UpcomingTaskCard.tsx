import { View, Text, StyleSheet } from 'react-native';
import { styles } from '@/styles/courseStyles';
import React from 'react';

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
            <Text style={styles.title}>{task.title}</Text>
            <Text style={styles.info}>{task.course_name}</Text>
            <Text style={styles.due}>Due: {task.due_date}</Text>
        </View>
    );
}
