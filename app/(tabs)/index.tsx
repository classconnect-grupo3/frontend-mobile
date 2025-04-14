import { CountryPickerModal } from '@/components/CountryPickerModal';
import { CourseList } from '@/components/CourseList';
import { useAuth } from '@/contexts/sessionAuth';
import { client } from '@/lib/http';
import { styles } from '@/styles/homeScreenStyles';
import { useEffect, useState } from 'react';
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
];

export default function HomeScreen() {
  const auth = useAuth();
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);

  useEffect(() => {
    if (auth?.authState.authenticated && !auth.authState.location) {
      setShowCountryModal(true);
    }
  }, [auth]);

  const handleConfirmCountry = async (selectedCountry: string) => {
    try {
      await client.post('/users/me/location', {
        country: selectedCountry
      }, {
        headers: {
          'Authorization': `Bearer ${auth?.authState.token}`
        }
      });
      setSelectedCountry(selectedCountry);
      setShowCountryModal(false);
    } catch (e) {
      console.error("Failed to save country", e); // TODO: Handle this
    }
  };

  const renderCourse = ({ item }: any) => (
    <View style={styles.courseCard}>
      <Text style={styles.courseTitle}>{item.title}</Text>
      <Text style={styles.courseTeacher}>{item.teacher}</Text>
      <Text style={styles.courseDetails}>Next: {item.due}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <CountryPickerModal
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        onConfirm={handleConfirmCountry}
      />

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
        <TouchableOpacity onPress={() => {/* navigate to profile later */ }}>
          <Image
            source={require('@/assets/images/tuntungsahur.jpeg')}
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Your Courses</Text>
        <CourseList courses={MOCK_COURSES} />
        {selectedCountry && (
          <Text style={styles.countryText}>Selected country: {selectedCountry}</Text>
        )}
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
