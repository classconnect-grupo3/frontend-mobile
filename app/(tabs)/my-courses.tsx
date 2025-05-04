import { VerticalCourseList } from '@/components/VerticalCourseList';
import { styles } from '@/styles/homeScreenStyles';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
    Button,
    Image,
    Modal,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const MOCK_COURSES = [
    { id: '1', title: 'TDA', teacher: 'Iñaki Llorens', due: 'TP1: Prog Dinamica' },
    { id: '2', title: 'Redes', teacher: 'Iñaki Llorens', due: 'Leer hasta 5.4' },
    { id: '3', title: 'Taller 1', teacher: 'Iñaki Llorens', due: 'TP Individual' },
    { id: '4', title: 'Taller 2', teacher: 'Iñaki Llorens', due: 'TP1: Prog Dinamica' },
    { id: '5', title: 'Taller de Ciberseguridad y Criptografia', teacher: 'Iñaki Llorens', due: 'Leer hasta 5.4' },
    { id: '6', title: 'Organización de Datos', teacher: 'Iñaki Llorens', due: 'TP Individual' },
];

export default function HomeScreen() {
    const router = useRouter();
    const [showCreateCourse, setShowCreateCourse] = useState(false);

    const renderCourse = ({ item }: any) => (
        <View style={styles.courseCard}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.courseTeacher}>{item.teacher}</Text>
            <Text style={styles.courseDetails}>Next: {item.due}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Modal visible={showCreateCourse} animationType="slide">
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, marginBottom: 16 }}>Create Course (WIP)</Text>
                    <Button title="Close" onPress={() => setShowCreateCourse(false)} />
                </View>
            </Modal>

            <View style={styles.topBar}>
                <Image
                    source={require('@/assets/images/logo.png')}
                    style={styles.logo}
                />
                <TouchableOpacity onPress={() => { router.push('/profile') }}>
                    <Image
                        source={require('@/assets/images/tuntungsahur.jpeg')}
                        style={styles.profileIcon}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>My Courses</Text>
                <VerticalCourseList courses={MOCK_COURSES} />
            </View>


            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowCreateCourse(true)}
            >
                <Text style={styles.fabText}>＋</Text>
            </TouchableOpacity>
        </View>
    );
}
