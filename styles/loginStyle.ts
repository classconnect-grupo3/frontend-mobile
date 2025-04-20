import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8f8f8",
  },
  text: {
    fontSize: 24,
    marginBottom: 16,
    fontWeight: "bold",
  },
  error: {
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    marginBottom: 8,
  },
  button: {
    width: "100%",
    padding: 12,
    backgroundColor: "#007BFF",
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    height: 44,
  },
  togglePassword: {
    marginTop: 4,
    color: "#007BFF",
    textAlign: "right",
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 16,
  },
  link: {
    fontStyle: "italic",
    marginTop: 16,
    color: "#007BFF",
    textDecorationLine: "underline",
  },
  helperText: {
    width: "100%",
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textAlign: "left",
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },

});
