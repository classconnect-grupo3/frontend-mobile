import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { styles as courseStyles } from '@/styles/courseStyles';
import { NewTaskModal } from '@/components/NewTaskModal';

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
}

interface Props {
  tasks: Task[] | null;
  setTasks: React.Dispatch<React.SetStateAction<Task[] | null>>;
  loading: boolean;
  onSubmit: (taskId: string) => void;
  isTeacher: boolean;
}

export const TasksSection = ({ tasks, setTasks, loading, onSubmit, isTeacher }: Props) => {

    const [showTaskModal, setShowTaskModal] = useState(false);
    
    const handleAddTask = (task: Omit<Task, 'id'>) => {
    setTasks((prev) => [ ...(prev ?? []), { ...task, id: Date.now().toString() }]);
    };

    const handleDeleteTask = (id: string) => {
    setTasks((prev) => (prev ?? []).filter((task) => task.id !== id));
    };
    
  return (
    <>
      <Text style={courseStyles.sectionHeader}>Tareas</Text>

      {isTeacher && (
            <TouchableOpacity onPress={() => setShowTaskModal(true)} style={courseStyles.addButton}>
                <Text style={courseStyles.buttonText}>+ Agregar tarea</Text>
            </TouchableOpacity>
        )}

      {loading ? (
        <Text style={courseStyles.taskDescription}>Cargando tareas...</Text>
      ) : !tasks || tasks.length === 0 ? (
        <Text style={courseStyles.taskDescription}>No hay tareas disponibles.</Text>
      ) : (
        tasks.map((task) => (
          <View key={task.id} style={courseStyles.taskCard}>
            <Text style={courseStyles.taskTitle}>{task.title}</Text>
            <Text style={courseStyles.taskDescription}>{task.description}</Text>
            <Text style={courseStyles.taskDeadline}>⏰ {task.deadline}</Text>
            {isTeacher && (
                <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
                    <Text style={courseStyles.taskDelete}>Eliminar</Text>
                </TouchableOpacity>
            )}

            {!isTeacher && (
              <TouchableOpacity
                style={courseStyles.addButton}
                onPress={() => onSubmit(task.id)}
              >
                <Text style={courseStyles.buttonText}>Entregar</Text>
              </TouchableOpacity>
            )}

            <NewTaskModal
                visible={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                onCreate={handleAddTask}
                />
          </View>
        ))
      )}
    </>
  );
};
