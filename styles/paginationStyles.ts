import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 12,
    },
    pageButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 6,
        margin: 4,
    },
    pageButtonText: {
        color: 'white',
    },
    pageIndicator: {
        margin: 4,
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
});
