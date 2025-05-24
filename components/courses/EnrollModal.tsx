import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { courseClient } from '@/lib/courseClient';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts/sessionAuth';
import React from 'react';
import { styles } from '@/styles/modalStyle';

interface Props {
  visible: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

export function EnrollModal({ visible, onClose, courseId, courseTitle }: Props) {
  const { authState } = useAuth();

  const handleConfirm = async () => {
    try {
      await courseClient.post(`/courses/${courseId}/enroll`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });
      Toast.show({ type: 'success', text1: 'Inscripción exitosa' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'No se pudo inscribir' });
    } finally {
      onClose();
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
