import { CountryPickerModal } from '@/components/CountryPickerModal';
import { CourseList } from '@/components/courses/CourseList';
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
import { UpcomingTasksList } from '@/components/UpcomingTaskList';
import React from 'react';
import { useCourses } from '@/contexts/CoursesContext';
import Header from '@/components/Header';

const MOCK_TASKS = [
  { id: '1', title: 'TP1: Prog Dinámica', course_name: 'TDA', due_date: '23/05/25', course_id: '1' },
  { id: '2', title: 'Leer hasta 5.4', course_name: 'Redes', due_date: '24/05/25', course_id: '2' },
  { id: '3', title: 'TP Individual', course_name: 'TDA', due_date: '25/05/25', course_id: '3' },
];

export default function HomeScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const {courses, addCourse} = useCourses();

  useEffect(() => {
    const requestAndSaveLocation = async () => {
      if (!auth?.authState.authenticated) return;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({
            type: 'error',
            text1: 'Location permission denied',
            // export default function App() {
            //   const { session } = useSession();
            //   if (!session) return <Redirect href="/(login)" />;
            //   return <Redirect href="/(tabs)" />;
            // }
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

      <Header/>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title}>Upcoming Tasks</Text>
          <UpcomingTasksList tasks={MOCK_TASKS} />
        </View>
        <View style={styles.row}>
          <Text style={styles.title}>Recent Courses</Text>
          <CourseList courses={courses} />
        </View>
      </View>

      {
        locationLabel && (
          <Text style={styles.countryText}>{locationLabel}</Text>
        )
      }


      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateCourse(true)}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}
