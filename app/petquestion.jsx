import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export default function petquestion() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="paw" size={80} color="#deb887" style={styles.icon} />
        <Text style={styles.questionText}>Do you have a pet?</Text>
        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.yesButton}
            onPress={() => router.push("/addpetinfo")}
          >
            <Text style={styles.yesText}>Yes, I do!</Text>
          </Pressable>

          <Pressable
            style={styles.noButton}
            onPress={() => router.push("/mainhome")}
          >
            <Text style={styles.noText}>No, not yet</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "85%",
    alignItems: "center",
  },
  icon: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 28,
    fontFamily: "firacode-bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
  },
  yesButton: {
    backgroundColor: "#deb887",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
  },
  yesText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "firacode-bold",
  },
  noButton: {
    backgroundColor: "transparent",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#deb887",
  },
  noText: {
    color: "#deb887",
    fontSize: 18,
    fontFamily: "firacode-bold",
  },
});
