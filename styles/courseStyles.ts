import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  scrollContainer: {
    paddingTop: 48,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  back: {
    fontSize: 24,
  },
  role: {
    fontSize: 16,
    backgroundColor: '#eee',
    padding: 6,
    borderRadius: 8,
    color: '#333',
  },
  section: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    fontSize: 16,
  },
    materialToggle: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 16,
  },
  materialLinks: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    paddingLeft: 20,
   
  },
  materialLink: {
    fontSize: 16,
    color: '#333',
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
  materialToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowIcon: {
    marginRight: 8,
  },
  materialToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 8,
    color: '#333',
  },
  taskCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },

  taskTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  taskDescription: {
    fontSize: 16,
    color: '#333',
  },
  taskDeadline: {
    color: '#666',
    marginTop: 4,
  },

  taskDelete: {
    color: 'red',
    marginTop: 8,
  },

  newTaskForm: {
    marginTop: 12,
    marginBottom: 24,
  },  
  input: {
    borderWidth: 1,
    color: '#333',
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },

  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingLeft: 12,
    marginBottom: 16,
  },

  listItem: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  card: {
    width: 200,
    height: 120,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    color: '#333',
  },
  wideCard: {
    width: '100%',
    height: 120,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    color: '#333',
    flexShrink: 1, 
    flexGrow: 1, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    color: '#333',
  },
  info: {
    flex: 1,
    marginRight: 12,
    color: '#333',
    flexShrink: 1, 
    flexGrow: 1, 
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  teacher: {
    fontSize: 14,
    color: '#555',
  },
  due: {
    fontSize: 13,
    color: '#888',
    flexWrap: 'wrap',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ccc',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  editButtonText: {
    color: '#333',
    fontWeight: '500',
    marginLeft: 6,
  },
  addModuleText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
