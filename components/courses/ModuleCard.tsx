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
} from 'react-native';
import { AntDesign, Feather, Entypo, MaterialIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export interface ModuleData {
  id: string;
  title: string;
  description: string;
  resources: { id: string; name: string }[];
}

export interface ModuleCardProps {
  moduleData: ModuleData;
  onUpdateModule: (updatedModule: ModuleData) => void;
  onAddResource: (moduleId: string) => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ moduleData, onUpdateModule, onAddResource }) => {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(moduleData.title);
  const [description, setDescription] = useState(moduleData.description);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const toggleEditMode = () => {
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
        marginBottom: 12,
        elevation: 4,
        shadowOpacity: 0.05,
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
        <View style={{ marginTop: 12 }}>
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
          <FlatList
            data={moduleData.resources}
            keyExtractor={(item) => item.id}
            style={{ marginTop: 8, backgroundColor: '#f9f9f9', padding: 8, borderRadius: 8 }}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginTop: 4 }}>
                <Feather name="file-text" size={16} color="#555" style={{ marginRight: 8 }} />
                <Text style={styles.file}>{item.name}</Text>
                { editMode && (
                  <TouchableOpacity
                    onPress={() => {
                      const updatedResources = moduleData.resources.filter((res) => res.id !== item.id);
                      onUpdateModule({ ...moduleData, resources: updatedResources });
                    }}
                    style={{ marginLeft: 'auto' , flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.deleteResource}>Eliminar</Text>
                    <Entypo name="cross" size={16} color="#ff0000" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          />

          <TouchableOpacity onPress={() => onAddResource(moduleData.id)} style={styles.addResourceButton}>
            <Text style={styles.buttonText}>+ Agregar recurso</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
            {editMode ? (
              <>
                <TouchableOpacity onPress={saveChanges} style={{ marginRight: 8 }}>
                  <AntDesign name="save" size={20} color="green" />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleEditMode}>
                  <AntDesign name="close" size={20} color="red" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={toggleEditMode}>
                <MaterialIcons name="edit" size={18} color="#333" />
                <Text style={styles.editButtonText}>Editar módulo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: '#333',
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#333',
  },
  file: {
    fontSize: 12,
    color: '#555',
  },
  addResourceButton: {
    padding: 4,
    alignItems: 'flex-start',
  },

  buttonText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 14,
  },

  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },

  editTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
    borderRadius: 8,
    padding: 8,
    borderColor: '#ccc',
    paddingBottom: 8,
  },

  editDescription: {
    borderBottomWidth: 1,
    color: '#333',
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    textAlignVertical: 'top', 
    marginBottom: 12,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  editButtonText: {
    color: '#333',
    fontWeight: '500',
    marginLeft: 6,
  },

  deleteResource: {
    color: '#ff0000',
    fontSize: 12,
    marginEnd: 4,
  }
});

export default ModuleCard;
