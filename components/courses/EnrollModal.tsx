import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { courseClient as client } from '@/lib/courseClient';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts/sessionAuth';
import React from 'react';
import { styles } from '@/styles/modalStyle';
import { useCourses } from '@/contexts/CoursesContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  studentId: string;
}

export function EnrollModal({ visible, onClose, courseId, courseTitle, studentId }: Props) {
  const { authState } = useAuth();
  const {  reloadCourses } = useCourses();

  const handleConfirm = async () => {
    try {
      const body = {
        student_id: studentId,
      };

      const r = await client.post(`/courses/${courseId}/enroll`, body, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },

      });
      console.log('Inscripcion exitosa');
      Toast.show({ type: 'success', text1: 'Inscripción exitosa' });
      setTimeout(onClose, 500); 
      reloadCourses();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'No se pudo inscribir' });
      setTimeout(onClose, 500); 
    } 
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>¿Te gustaría inscribirte al curso "{courseTitle}"?</Text>
          <View style={localStyles.buttons}>
            <TouchableOpacity onPress={onClose} style={localStyles.cancel}>
              <Text style={localStyles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={localStyles.confirm}>
              <Text style={localStyles.confirmText}>Inscribirme</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
    buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancel: {
    padding: 10,
    backgroundColor: '#ccc',
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  cancelText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  confirm: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    flex: 1,
  },
  confirmText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#fff',
  },
});
