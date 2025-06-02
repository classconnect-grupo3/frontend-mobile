import { View, Text, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { styles as courseStyles } from '@/styles/courseStyles';
import { NewTaskModal } from '@/components/NewTaskModal';
import { courseClient } from '@/lib/courseClient';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts/sessionAuth';
import { Assignment } from '@/app/course/[id]/student';
import { AssignmentAnswerModal } from './AssignmentAnswerModal';

interface StudentSubmission {
  id: string;
  assignment_id: string;
  status: 'draft' | 'submitted';
  answers: {
    content: string;
    question_id: string;
  }[];
}

interface Props {
  tasks: Assignment[] | null;
  setTasks: React.Dispatch<React.SetStateAction<Assignment[]>>;
  loading: boolean;
  isTeacher: boolean;
  onSubmit: (assignmentId: string) => Promise<void>;
}

export const TasksSection = ({ tasks, setTasks, loading, isTeacher }: Props) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmission[]>([]);

  const auth = useAuth();
  const authState = auth?.authState;

  const handleCreateSubmission = async (assignmentId: string) => {
    const res = await courseClient.post(`/assignments/${assignmentId}/submissions`, {
      student_id: authState?.user?.id,
      content: 'Primera entrega del estudiante',
    }, {
      headers: { Authorization: `Bearer ${authState?.token}` },
    });
    return res.data; // incluye id
  };

  const handleUpdateSubmission = async (assignmentId: string, submissionId: string) => {
    await courseClient.put(`/assignments/${assignmentId}/submissions/${submissionId}`, {
      content: 'Entrega actualizada desde la app',
    }, {
      headers: { Authorization: `Bearer ${authState?.token}` },
    });
  };

  const handleSubmitFinal = async (assignmentId: string, submissionId: string) => {
    await courseClient.post(`/assignments/${assignmentId}/submissions/${submissionId}/submit`, {}, {
      headers: { Authorization: `Bearer ${authState?.token}` },
    });
  };

  const handleAddTask = (task: Assignment) => {
    setTasks((prev) => [ ...(prev ?? []), { ...task, id: task.id || Date.now().toString() }]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => (prev ?? []).filter((task) => task.id !== id));
  };

  

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!authState?.user?.id || !authState?.token) return;
      try {
        const { data } = await courseClient.get(`/students/${authState.user.id}/submissions`, {
          headers: { Authorization: `Bearer ${authState.token}` }
        });
        setStudentSubmissions(data);
      } catch (e) {
        console.error('Error fetching submissions:', e);
      }
    };

    fetchSubmissions();
  }, [authState?.user?.id, authState?.token]);

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
        tasks.map((task: Assignment) => {
          const taskSubmissions = studentSubmissions.filter(
            (sub) => sub.assignment_id === task.id
          );

          return (
            <View key={task.id} style={courseStyles.taskCard}>
              <Text style={courseStyles.taskTitle}>{task.title}</Text>
              <Text style={courseStyles.taskDescription}>{task.description}</Text>
              <Text style={courseStyles.taskDescription}>📘 Tipo: {task.type === 'exam' ? 'Examen' : 'Tarea'}</Text>
              <Text style={courseStyles.taskDescription}>📄 Instrucciones: {task.instructions}</Text>
              <Text style={courseStyles.taskDeadline}>⏰ Fecha límite: {new Date(task.due_date).toLocaleDateString()}</Text>
              <Text style={courseStyles.taskDescription}>🕒 Estado: {task.status}</Text>
              <Text style={courseStyles.taskDescription}>📚 Preguntas: {task.questions.length}</Text>

              {isTeacher && (
                <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
                  <Text style={courseStyles.taskDelete}>Eliminar</Text>
                </TouchableOpacity>
              )}

              {!isTeacher && (
                <>
                  {!task.submission ? (
                    <TouchableOpacity
                      style={courseStyles.addButton}
                      onPress={() => setSelectedAssignment(task)}
                    >
                      <Text style={courseStyles.buttonText}>Responder preguntas</Text>
                    </TouchableOpacity>
                  ) : !task.submission.submitted ? (
                    <>
                      <TouchableOpacity
                        style={courseStyles.addButton}
                        onPress={() => setSelectedAssignment(task)}
                      >
                        <Text style={courseStyles.buttonText}>Responder preguntas</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={courseStyles.addButton}
                        onPress={async () => {
                          if (task.submission && task.submission.id) {
                            try {
                              await handleSubmitFinal(task.id, task.submission.id);
                              Toast.show({ type: 'success', text1: 'Entrega enviada' });
                              setTasks((prev) =>
                                prev?.map((t) =>
                                  t.id === task.id
                                    ? { ...t, submission: { ...t.submission!, submitted: true } }
                                    : t
                                ) ?? []
                              );
                            } catch {
                              Toast.show({ type: 'error', text1: 'Error al enviar la entrega' });
                            }
                          }
                        }}
                      >
                        <Text style={courseStyles.buttonText}>Enviar entrega</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={courseStyles.taskDescription}>✔ Entregada</Text>
                  )}

                  {taskSubmissions.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={courseStyles.taskDescription}>📥 Entregas anteriores:</Text>
                      {taskSubmissions.map((sub) => (
                        <View key={sub.id} style={{ paddingLeft: 8 }}>
                          <Text style={courseStyles.taskDescription}>
                            • {sub.status === 'submitted' ? '✔ Entregada' : '📝 Borrador'}
                          </Text>
                          {sub.status === 'draft' && (
                            <TouchableOpacity
                              style={courseStyles.addButton}
                              onPress={async () => {
                                try {
                                  await handleSubmitFinal(task.id, sub.id);
                                  Toast.show({ type: 'success', text1: 'Entrega enviada' });
                                } catch {
                                  Toast.show({ type: 'error', text1: 'Error al enviar la entrega' });
                                }
                              }}
                            >
                              <Text style={courseStyles.buttonText}>Enviar esta entrega</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        }))}

      <NewTaskModal
        visible={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onCreate={(task) => handleAddTask({ 
          ...task, 
          id: Date.now().toString(),
          instructions: '',
          type: 'homework',
          status: 'pending',
          questions: []
        })}
      />

      {selectedAssignment && (
        <AssignmentAnswerModal
          visible={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          assignment={selectedAssignment}
        />
      )}
    </>
  );
};
