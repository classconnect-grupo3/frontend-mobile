import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles as homeStyles } from '@/styles/homeScreenStyles';
import { styles as courseStyles } from '@/styles/courseStyles';
import { MaterialIcons } from '@expo/vector-icons';
import { EditCourseModal } from '@/components/courses/EditCourseModal';
import { useState } from 'react';
import React from 'react';

interface Props {
  role: 'Docente' | 'Alumno';
  onBack: () => void;
  canEdit?: boolean;
  course?: any; // puedes tiparlo como `Course` si querés
  onEditSuccess?: () => void;
}

export function CourseTopBar({ role, onBack, canEdit = false, course, onEditSuccess }: Props) {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <View style={homeStyles.topBar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={courseStyles.back}>←</Text>
        </TouchableOpacity>
        <Text style={homeStyles.title}>{course.title}</Text>
        <Text style={courseStyles.role}>rol: {role}</Text>
        <Image
          source={require('@/assets/images/profile-placeholder.jpeg')}
          style={homeStyles.profileIcon}
        />
      </View>

      <View style={homeStyles.topBar}>
        <Text style={courseStyles.taskTitle}>Description</Text>
        <Text style={courseStyles.taskDescription}>{course.description}</Text>
      </View>

      <View style={homeStyles.topBar}>
        <Text style={courseStyles.taskTitle}>Capacity</Text>
        <Text style={courseStyles.taskDescription}>{course.capacity} students</Text>
      </View>

      {canEdit && course && (
        <>
          <TouchableOpacity
            style={courseStyles.editButton}
            onPress={() => setShowEditModal(true)}
          >
            <MaterialIcons name="edit" size={18} color="#333" />
            <Text style={courseStyles.editButtonText}>Editar curso</Text>
          </TouchableOpacity>

          <EditCourseModal
            visible={showEditModal}
            onClose={() => setShowEditModal(false)}
            course={course}
            onSuccess={onEditSuccess}
          />
        </>
      )}
    </>
  );
}
