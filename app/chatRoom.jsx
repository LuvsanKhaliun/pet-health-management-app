import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FakeChatScreen() {
  const messages = [
    { id: "1", text: "Hey! How's your pet doing? 🐶", isMe: false },
    { id: "2", text: "She's doing great! Ate well today 💖", isMe: true },
    { id: "3", text: "Aww that's so cute 🥹", isMe: false },
    { id: "4", text: "Yes haha, very active today!", isMe: true },
    {
      id: "5",
      text: "We should let them play together sometime!",
      isMe: false,
    },
    { id: "6", text: "Yesss!! That would be fun 🐾", isMe: true },
  ];

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.message,
        item.isMe ? styles.myMessage : styles.otherMessage,
      ]}
    >
      {!item.isMe && <Text style={styles.name}>Friend</Text>}
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <Text style={styles.header}>🐾 Pet Chat</Text>

      {/* CHAT LIST */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 10 }}
      />

      {/* INPUT + SEND */}
      <View style={styles.inputContainer}>
        <TextInput placeholder="Type message..." style={styles.input} />
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff7fb",
    padding: 10,
  },

  header: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  message: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 15,
    marginVertical: 5,
  },

  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#ffb6c1",
  },

  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#cde7ff",
  },

  text: {
    color: "#333",
  },

  name: {
    fontSize: 12,
    color: "#666",
    marginBottom: 3,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    padding: 10,
    backgroundColor: "#fff",
    marginRight: 5,
  },

  sendButton: {
    backgroundColor: "#ffb6c1",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },

  sendText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
