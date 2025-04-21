import { CountryPickerModal } from '@/components/CountryPickerModal';
import { CourseList } from '@/components/CourseList';
import { useAuth } from '@/contexts/sessionAuth';
import { client } from '@/lib/http';
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
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';

const MOCK_COURSES = [
  { id: '1', title: 'TDA', teacher: 'Iñaki Llorens', due: 'TP1: Prog Dinamica' },
  { id: '2', title: 'Redes', teacher: 'Iñaki Llorens', due: 'Leer hasta 5.4' },
  { id: '3', title: 'Taller 1', teacher: 'Iñaki Llorens', due: 'TP Individual' },
];

export default function HomeScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  useEffect(() => {
    const requestAndSaveLocation = async () => {
      if (!auth?.authState.authenticated || auth.authState.location) return;
  
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({
            type: 'error',
            text1: 'Location permission denied',
            text2: 'We couldn’t access your location.',
          });
          return;
        }
  
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
  
        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverse.length > 0) {
          const place = reverse[0];
          const label = `📍 ${place.city ?? place.name}, ${place.country}`;
          setLocationLabel(label);
        }
  
        await client.post(
          '/users/me/location',
          { latitude, longitude },
          {
            headers: {
              Authorization: `Bearer ${auth.authState.token}`,
            },
          }
        );
  
        Toast.show({
          type: 'success',
          text1: 'Location saved',
          text2: 'Your location has been registered.',
        });
      } catch (error) {
        console.error('Failed to get or save location', error);
        Toast.show({
          type: 'error',
          text1: 'Location error',
          text2: 'Something went wrong while saving your location.',
        });
      }
    };
  
    requestAndSaveLocation();
  }, [auth]);

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
        <TouchableOpacity onPress={() => {router.push('/profile')}}>
          <Image
            source={require('@/assets/images/tuntungsahur.jpeg')}
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Your Courses</Text>
        <CourseList courses={MOCK_COURSES} />
        {
          locationLabel && (
            <Text style={styles.countryText}>{locationLabel}</Text>
          )
        }
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
