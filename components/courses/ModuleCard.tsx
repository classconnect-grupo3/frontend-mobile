import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Button,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
} from 'react-native';
import { AntDesign, Feather, Entypo, MaterialIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type ModuleResource = {
  id: string
  name: string
  url: string
}

export interface ModuleData {
  id: string
  course_id: string
  title: string
  description: string
  resources: ModuleResource[]
}


export interface ModuleCardProps {
  moduleData: ModuleData;
  onUpdateModule: (updatedModule: ModuleData) => void;
  onAddResource: (moduleId: string) => void;
  onDeleteModule: (moduleId: string) => void;
  isTeacher: boolean,
}

const ModuleCard: React.FC<ModuleCardProps> = ({ moduleData, onUpdateModule, onAddResource, onDeleteModule, isTeacher }) => {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(moduleData.title);
  const [description, setDescription] = useState(moduleData.description);
  const [showDeleteModal, setShowDeleteModal] = useState(false);


  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
    if (expanded) {
      setEditMode(false);
    }
  };

  const toggleEditMode = () => {
    if (editMode) {
      // Exiting edit mode → reset unsaved changes
      setTitle(moduleData.title);
      setDescription(moduleData.description);
    }
    setEditMode(!editMode);
  };

  const saveChanges = () => {
    onUpdateModule({ ...moduleData, title, description });
    setEditMode(false);
  };


  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        marginBottom: 12,
      }}>
      <TouchableOpacity
        onPress={toggleExpanded}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        {editMode ? (
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.editTitle}
            placeholder="Module Title"
          />
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}
        <AntDesign name={expanded ? 'up' : 'down'} size={18} color="#333" />
      </TouchableOpacity>

      {expanded && (
        <View>
          {editMode ? (
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Module Description"
              style={styles.editDescription}
            />
          ) : (
            <Text style={styles.description}>{description}</Text>
          )}
          <Text style={styles.heading}>Recursos</Text>
          { moduleData.resources?.length > 0 ? (          
            <FlatList
              data={moduleData.resources}
              keyExtractor={(item) => item.id}
              style={{ marginTop: 8, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 }}
              renderItem={({ item }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginTop: 4 }}>
                  <Feather name="file-text" size={16} color="#555" style={{ marginRight: 8 }} />
                  <Text
                      onPress={() => Linking.openURL(item.url)}
                      style={styles.file}
                  >
                      {item.name}
                  </Text>
                  { editMode && (
                    <TouchableOpacity
                      onPress={() => {
                        const updatedResources = moduleData.resources.filter((res) => res.id !== item.id); 
                        onUpdateModule({ ...moduleData, resources: updatedResources });
                      }} 
                      style={{ marginLeft: 'auto' , flexDirection: 'row', alignItems: 'center' }}> 
                      <Text style={styles.deleteResource}>Eliminar</Text>More actions
                      <Entypo name="cross" size={16} color="#ff0000" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          ) : (
            <Text style={styles.greyText}>
              No se han agregado recursos a este módulo.
            </Text>
          )}

          <TouchableOpacity onPress={() => onAddResource(moduleData.id)} style={styles.addResourceButton}>
            <Text style={styles.buttonText}>+ Agregar recurso</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
            {editMode ? (
              <>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={toggleEditMode}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={saveChanges}>
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </>
            ) : (
              isTeacher && (
              <>
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={toggleEditMode}>
                  <MaterialIcons name="edit" size={18} color="#1976D2" />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={() => setShowDeleteModal(true)}>
                  <MaterialIcons name="delete" size={18} color="rgb(238, 69, 69)" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </>
              )
            )}
          </View>
        </View>
      )}
      {showDeleteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Eliminar módulo?</Text>
            <Text style={styles.modalMessage}>Esta acción no se puede deshacer.</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: 'rgb(238, 69, 69)' }]}
                onPress={() => {
                  onDeleteModule(moduleData.id);
                  setShowDeleteModal(false);
                }}>
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: '#333',
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#333',
  },
  file: { 
    color: "#007bff", 
    textDecorationLine: "underline",
    fontSize: 12,
    flexShrink: 1,
    flexWrap: 'wrap',
    flex: 1, 
  },
  greyText: {
    fontSize: 14,
    color: "grey",
  },
  addResourceButton: {
    backgroundColor: "#ecffe6",
    padding: 4,
    paddingHorizontal: 8,
    alignContent: "center",
    marginTop: 8,
    alignItems: 'flex-start',
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  buttonText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 14,
  },

  description: {
    fontSize: 14,
    color: 'grey',
    marginBottom: 12,
  },

  editTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    borderColor: '#ccc',
    textAlignVertical: "center",
    marginBottom: 8,
  },

  editDescription: {
    borderWidth: 1,
    color: 'grey',
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    marginBottom: 8,
    textAlignVertical: "center",
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor:"rgb(255, 231, 231)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },

  deleteButtonText: {
    color: 'rgb(238, 69, 69)',
    fontWeight: '500',
    marginLeft: 6,
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },

  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#ededed',
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: "#E3F2FD",
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },
  editButtonText: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  saveButtonText: {
    color: 'white',
    fontWeight: '500',
  },

  cancelButtonText: {
    color: 'grey',
    fontWeight: '500',
  },

  deleteResource: {
    color: '#ff0000',
    fontSize: 12,
    marginEnd: 4,
  },
  
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  
  modalTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  modalMessage: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
});

export default ModuleCard;
