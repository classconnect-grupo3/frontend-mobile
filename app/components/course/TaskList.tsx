import React from 'react';
import { View, Text } from 'react-native';

export function TaskList({ tasks }) {
  return (
    <>
      {tasks.map(task => (
        <View key={task.id} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
          <Text style={{ fontWeight: 'bold' }}>{task.title}</Text>
          <Text>{task.description}</Text>
          <Text>⏰ {task.deadline}</Text>
        </View>
      ))}
    </>
  );
} 
