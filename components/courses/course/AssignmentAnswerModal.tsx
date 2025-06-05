import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { styles as courseStyles } from '@/styles/courseStyles';
import { courseClient } from '@/lib/courseClient';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts/sessionAuth';

interface Question {
  id: string;
  text: string;
  type: string;
  options?: string[];
}

interface Assignment {
  id: string;
  questions: Question[];
  title: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  assignment: Assignment;
  fetchSubmissions: () => void;
}

export const AssignmentAnswerModal = ({ visible, onClose, assignment, fetchSubmissions }: Props) => {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { authState } = useAuth();

  console.log("Assignment: ", assignment);
  console.log("Assigment Questions: ", assignment.questions);

  const handleChange = (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    try {
      const answers = assignment.questions.map((q) => ({
        content: responses[q.id] ?? '',
        feedback: '',
        question_id: q.id,
        score: 0,
        type: q.type,
      }));
      const data = await courseClient.post(`/assignments/${assignment.id}/submissions`, {
        answers,
      }, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
          "X-Student-UUID": authState.user?.id,
        },
      });
      console.log('Entrega realizada', data.data);

      Toast.show({ type: 'success', text1: 'Entrega realizada con éxito' });
      fetchSubmissions();
      onClose();
    } catch (e) {
      console.error('Error al entregar', e);
      Toast.show({ type: 'error', text1: 'Error al enviar respuestas' });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={courseStyles.modalBackground}>
        <View style={[courseStyles.modalContent, { maxHeight: '80%' }]}>
          <ScrollView>
            <Text style={courseStyles.modalTitle}>Responder: {assignment.title}</Text>
            {assignment.questions.map((q) => (
            <View key={q.id} style={{ marginBottom: 16 }}>
              <Text style={courseStyles.questionText}>{q.text}</Text>

              {q.type === 'text' && (
                <TextInput
                  style={courseStyles.input}
                  placeholder="Escribí tu respuesta"
                  value={responses[q.id] || ''}
                  onChangeText={(text) => setResponses((prev) => ({ ...prev, [q.id]: text }))}
                />
              )}

              {q.type === 'multiple_choice' && (
                q.options?.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      courseStyles.option,
                      responses[q.id] === opt && courseStyles.selectedOption,
                    ]}
                    onPress={() =>
                      setResponses((prev) => ({ ...prev, [q.id]: opt }))
                    }
                  >
                    <Text style={courseStyles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                ))
              )}

              {q.type === 'file' && (
                <TouchableOpacity
                  style={courseStyles.uploadButton}
                  onPress={() => {
                    // TODO: conectar con un file picker (puede ser expo-document-picker o similar)
                    alert("Funcionalidad de subida de archivo aún no implementada");
                  }}
                >
                  <Text style={courseStyles.buttonText}>
                    {responses[q.id] ? 'Archivo seleccionado' : 'Subir archivo'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
            <TouchableOpacity style={[courseStyles.addButton, { marginTop: 12 }]} onPress={handleSubmit}>
              <Text style={courseStyles.buttonText}>Enviar respuestas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12 }} onPress={onClose}>
              <Text style={courseStyles.link}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
