import { Modal, View, Text, StyleSheet, Button } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import React from "react";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (country: string) => void;
}

export function CountryPickerModal({ visible, onClose, onConfirm }: Props) {
  const [selectedCountry, setSelectedCountry] = useState("Argentina");

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select your country</Text>

          <Picker
            selectedValue={selectedCountry}
            onValueChange={(itemValue) => setSelectedCountry(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Argentina 🇦🇷" value="Argentina" />
            <Picker.Item label="Chile 🇨🇱" value="Chile" />
            <Picker.Item label="Uruguay 🇺🇾" value="Uruguay" />
          </Picker>

          <View style={styles.buttons}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Confirm" onPress={() => onConfirm(selectedCountry)} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: "center",
  },
  picker: {
    marginBottom: 20,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
