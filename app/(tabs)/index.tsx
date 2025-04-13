import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useAuth } from '@/contexts/sessionAuth';
import { CountryPickerModal } from '@/components/CountryPickerModal';
import { client } from '@/lib/http';

export default function HomeScreen() {
  const auth = useAuth();
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    if (auth?.authState.authenticated && !auth.authState.location) {
      setShowCountryModal(true);
    }
  }, [auth]);

  // const handleConfirmCountry = async (selectedCountry: string) => {
  //   try {
  //     await client.post('/users/me/location', { country: selectedCountry });
  //     setCountry(selectedCountry);
  //     setShowCountryModal(false);
  //   } catch (e) {
  //     console.error("Failed to save country", e);
  //   }
  // };

  const handleConfirmCountry = (country: string) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
  };

  return (
    <View style={styles.container}>
      <Image source={require("@/assets/images/logo.png")} style={styles.image} />
      <CountryPickerModal
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        onConfirm={handleConfirmCountry}
      />
      <Text style={styles.topLeftText}>ClassConnect</Text>
      <Text style={styles.contentText}>Work in progress 🚧</Text>
      {selectedCountry && (
        <Text style={styles.countryText}>Selected country: {selectedCountry}</Text>
      )}
      <Image source={require("@/assets/images/tuntungsahur.jpeg")} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  topLeftText: {
    position: 'absolute',
    top: 16,
    left: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentText: {
    marginTop: 80,
    textAlign: 'center',
    fontSize: 20,
  },
  countryText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 16,
  },
});
