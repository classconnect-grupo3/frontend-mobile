import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCourses } from '@/contexts/CoursesContext';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import React from 'react';

export default function CourseViewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { courses } = useCourses();
  const [showMaterials, setShowMaterials] = useState(false);

  const course = courses.find((c) => c.id === id);

  if (!course) {
    return (
      <View style={styles.container}>
        <Text>404</Text>
        <Text>Course not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.role}>rol: Docente</Text>
        <View style={styles.avatar} />
      </View>

      {/* Course Info */}
      <Text style={styles.section}>{course.title}</Text>
      <Text style={styles.section}>Tareas</Text>
      <Text style={styles.section}>Modulo 1: Capa de Aplicacion</Text>

      {/* Collapsible Material Section */}
      <TouchableOpacity onPress={() => setShowMaterials(!showMaterials)} style={styles.materialToggle}>
        <Text>📁 Click para desplegar material</Text>
      </TouchableOpacity>
      {showMaterials && (
        <View style={styles.materialLinks}>
          <Text>• link 1</Text>
          <Text>• link 2</Text>
          <Text>• link 3</Text>
        </View>
      )}

      {/* Navigation */}
      <TouchableOpacity style={styles.actionButton}>
        <Text>Ver Alumnos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <Text>Ver Docentes</Text>
      </TouchableOpacity>

      {/* Bottom nav is likely already handled in layout/tab router */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  back: {
    fontSize: 24,
  },
  role: {
    fontSize: 16,
    backgroundColor: '#eee',
    padding: 6,
    borderRadius: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    backgroundColor: '#ccc',
    borderRadius: 18,
  },
  section: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    fontSize: 16,
  },
  materialToggle: {
    backgroundColor: '#e2e2e2',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  materialLinks: {
    paddingLeft: 16,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#ddd',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  link: {
    color: '#007AFF',
    marginTop: 16,
  },
});
