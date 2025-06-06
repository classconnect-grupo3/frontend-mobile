import { View, Text, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { styles as courseStyles } from '@/styles/courseStyles';
import { NewTaskModal } from '@/components/NewTaskModal';
import { courseClient } from '@/lib/courseClient';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts/sessionAuth';
import { AssignmentAnswerModal } from './AssignmentAnswerModal';
import { Assignment } from '@/app/course/[id]/CourseViewScreen';

interface StudentSubmission {
  id: string;
  assignment_id: string;
  status: 'draft' | 'submitted' | 'late';
  answers: {
    content: string;
    question_id: string;
  }[];
}

interface Props {
  label: string;
  tasks: Assignment[] | null;
  setTasks: React.Dispatch<React.SetStateAction<Assignment[] | null>>;
  loading: boolean;
  isTeacher: boolean;
}

export const TasksSection = ({ label, tasks, setTasks, loading, isTeacher }: Props) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmission[]>([]);

  const auth = useAuth();
  const authState = auth?.authState;

  const handleAddTask = (task: Omit<Assignment, 'id'>) => {
    setTasks((prev) => [ ...(prev ?? []), { ...task, id: Date.now().toString() }]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => (prev ?? []).filter((task) => task.id !== id));
  };

  const fetchSubmissions = async () => {
    if (!authState?.user?.id || !authState?.token) return;
    try {
      const { data } = await courseClient.get(`/students/${authState.user.id}/submissions`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
          "X-Student-UUID": authState.user?.id,
        },
      });
      setStudentSubmissions(data);
    } catch (e) {
      console.error('Error fetching submissions:', e);
    }
  };

  const handleSubmitFinal = async (assignmentId: string, submissionId: string) => {
    try {
      const data = await courseClient.post(
        `/assignments/${assignmentId}/submissions/${submissionId}/submit`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authState.token}`,
            "X-Student-UUID": authState.user?.id,
          },
        }
      );
      console.log('Entrega enviada:', data);
      Toast.show({ type: 'success', text1: 'Entrega enviada exitosamente' });
      await fetchSubmissions();
    } catch (error) {
      console.error('Error al enviar la entrega:', error);
      Toast.show({ type: 'error', text1: 'Error al enviar la entrega' });
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [authState?.user?.id, authState?.token]);

  return (
    <>
      <Text style={courseStyles.sectionHeader}>{label}</Text>

      {isTeacher && (
        <TouchableOpacity onPress={() => setShowTaskModal(true)} style={courseStyles.addButton}>
          <Text style={courseStyles.buttonText}>+ Agregar tarea</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <Text style={courseStyles.taskDescription}>Cargando tareas...</Text>
      ) : !tasks || tasks.length === 0 ? (
        <Text style={courseStyles.taskDescription}>No hay tareas</Text>
      ) : (
        tasks.map((task: Assignment) => {
          const submission = studentSubmissions.find((sub) => sub.assignment_id === task.id);
          const isSubmitted = submission?.status === 'submitted';
          const isLate = submission?.status === 'late';
          console.log('Submission for task:', task.id, submission);

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
                  <TouchableOpacity
                    style={[courseStyles.addButton, (isSubmitted || isLate) && { opacity: 0.6 }]}
                    onPress={() => {
                      if (!(isSubmitted || isLate)) setSelectedAssignment(task);
                    }}
                    disabled={(isSubmitted || isLate)}
                  >
                    <Text style={courseStyles.buttonText}>Responder preguntas</Text>
                  </TouchableOpacity>

                  {submission && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={courseStyles.taskDescription}>📥 Entrega actual</Text>
                      <Text style={courseStyles.taskDescription}>
                        • {isSubmitted ? '✔ Entregada' : 
                        isLate ? '⏳ Entrega tardía' : '📝 Borrador'}
                      </Text>

                      {submission.answers?.length > 0 && (
                        <View style={{ marginTop: 4, paddingLeft: 8 }}>
                          <Text style={[courseStyles.taskDescription, { fontWeight: 'bold' }]}>Respuestas:</Text>
                          {submission.answers.map((answer, index) => (
                            <View key={index} style={{ marginVertical: 4 }}>
                              <Text style={courseStyles.taskDescription}>• Pregunta {index + 1}</Text>
                              <Text style={courseStyles.taskDescription}>Contenido: {answer.content}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {!(isSubmitted || isLate) && (
                        <TouchableOpacity
                          style={courseStyles.addButton}
                          onPress={() => handleSubmitFinal(task.id, submission.id)}
                        >
                          <Text style={courseStyles.buttonText}>Enviar esta entrega</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })
      )}

      <NewTaskModal
        visible={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onCreate={handleAddTask}
      />

      {selectedAssignment && (
        <AssignmentAnswerModal
          visible={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          assignment={selectedAssignment}
          fetchSubmissions={fetchSubmissions}
        />
      )}
    </>
  );
};
