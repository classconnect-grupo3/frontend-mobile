import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 8,
    },
    filterButton: {
        marginLeft: 10,
        padding: 10,
        backgroundColor: '#ddd',
        borderRadius: 8,
    },
    toggleContainer: {
        flexDirection: 'row',
        marginTop: 12,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    selectedButton: {
        backgroundColor: '#007AFF',
    },
    selectedText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    unselectedText: {
        color: '#333',
    },
});
