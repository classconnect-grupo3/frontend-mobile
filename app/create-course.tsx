import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView
} from 'react-native';

export default function CreateCourseScreen() {
    const [form, setForm] = useState({
        teacher: '',
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        capacity: ''
    });

    const isFormComplete = Object.values(form).every((val) => val.trim() !== '');

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create a new course</Text>

            <TextInput
                style={styles.input}
                placeholder="Teacher Name"
                value={form.teacher}
                onChangeText={(text) => handleChange('teacher', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Course Name"
                value={form.name}
                onChangeText={(text) => handleChange('name', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Description"
                value={form.description}
                onChangeText={(text) => handleChange('description', text)}
                multiline
            />
            <TextInput
                style={styles.input}
                placeholder="Start Date (YYYY-MM-DD)"
                value={form.startDate}
                onChangeText={(text) => handleChange('startDate', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="End Date (YYYY-MM-DD)"
                value={form.endDate}
                onChangeText={(text) => handleChange('endDate', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Capacity"
                keyboardType="numeric"
                value={form.capacity}
                onChangeText={(text) => handleChange('capacity', text)}
            />

            <TouchableOpacity
                style={[styles.createButton, !isFormComplete && styles.disabled]}
                disabled={!isFormComplete}
                onPress={() => {
                    // You can handle logic later
                    console.log('Created');
                }}
            >
                <Text style={styles.createText}>Create</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
        flexGrow: 1,
        backgroundColor: '#fff'
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        fontWeight: 'bold'
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 15
    },
    createButton: {
        backgroundColor: '#007bff',
        padding: 15,
        alignItems: 'center',
        borderRadius: 8
    },
    disabled: {
        backgroundColor: '#aaa'
    },
    createText: {
        color: '#fff',
        fontWeight: 'bold'
    }
});
