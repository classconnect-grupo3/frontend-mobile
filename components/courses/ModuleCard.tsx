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
import { AntDesign, Feather, Entypo } from '@expo/vector-icons';
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
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 4,
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

          <Text style={styles.heading}>Resources</Text>
          <FlatList
            data={moduleData.resources}
            keyExtractor={(item) => item.id}
            style={{ marginBottom: 12 , marginTop: 8 }}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Feather name="file-text" size={16} color="#555" style={{ marginRight: 8 }} />
                <Text style={styles.file}>{item.name}</Text>
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
              <TouchableOpacity onPress={toggleEditMode}>
                <Entypo name="edit" size={20} color="black" />
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
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
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
});

export default ModuleCard;
