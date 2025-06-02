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
            {assignment.questions.map((q, idx) => (
              <View key={q.id} style={{ marginBottom: 12 }}>
                <Text style={courseStyles.taskDescription}>{idx + 1}. {q.text}</Text>
                <TextInput
                  style={courseStyles.input}
                  placeholder="Tu respuesta..."
                  value={responses[q.id] || ''}
                  onChangeText={(text) => handleChange(q.id, text)}
                  multiline
                />
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
