import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CreateCourseScreen from '@/components/CreateCourseScreen';
import React from 'react';


interface Props {
  visible: boolean;
  onClose: () => void;
}

export function CreateCourseModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {/* Barra superior con botón de cerrar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Contenido del formulario */}
        <View style={styles.content}>
          <CreateCourseScreen onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 12,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
});
