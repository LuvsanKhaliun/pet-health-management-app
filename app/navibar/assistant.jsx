import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getAIResponse } from "./../aliyun";

export default function AIAssistant() {
  const initialMessage = {
    id: "1",
    text: "Hello! I am your AI Pet Pal. How can I help you and your furry friend?",
    sender: "ai",
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  const clearChat = () => {
    Alert.alert("Clear Chat", "Delete all messages?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setMessages([initialMessage]),
      },
    ]);
  };

  const quickActions = [
    {
      id: "1",
      label: "Health Tips",
      query: "Give me some general health tips for my pet.",
    },
    { id: "2", label: "Training", query: "How do I teach my pet to sit?" },
    { id: "3", label: "Diet", query: "What are the safe fruits for my pet?" },
  ];

  const sendMessage = async (text) => {
    const messageToSend = text || inputText;
    if (!messageToSend.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      text: messageToSend,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const aiResponseText = await getAIResponse(messageToSend);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: "ai",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsTyping(false);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messaageBubble,
        item.sender === "user" ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.sender === "user" ? styles.userText : styles.aiText,
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={clearChat} style={{ marginRight: 15 }}>
            <Ionicons name="trash-bin-outline" size={22} color="#FFB7B2" />
          </Pressable>
          <View style={styles.statusBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        ListHeaderComponent={() => (
          <View style={styles.quickActionContainer}>
            <Text style={styles.suggestionTitle}>Suggestions</Text>
            <View style={styles.chipStack}>
              {quickActions.map((action) => (
                <Pressable
                  key={action.id}
                  style={styles.chip}
                  onPress={() => sendMessage(action.query)}
                >
                  <Text style={styles.chipText}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        ListFooterComponent={() =>
          isTyping && (
            <View
              style={[styles.messaageBubble, styles.aiBubble, { width: 120 }]}
            >
              <Text style={styles.aiText}>Typing...</Text>
            </View>
          )
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <Pressable style={styles.sendBtn} onPress={() => sendMessage()}>
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "firacode-bold",
    color: "#444",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F9EE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  statusText: {
    fontFamily: "firacode-medium",
    fontSize: 12,
    color: "#4CAF50",
  },
  chatList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActionContainer: {
    marginBottom: 20,
  },
  suggestionTitle: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 10,
    fontFamily: "firacode-regular",
  },
  chipStack: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
  },
  chipText: {
    fontSize: 13,
    color: "#555",
    fontFamily: "firacode-medium",
  },
  messaageBubble: {
    maxWidth: "80%",
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#B2E2f2",
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF4D2",
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "firacode-regular",
  },
  userText: {
    color: "#2d4150",
  },
  aiText: {
    color: "#444",
  },
  inputWrapper: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontFamily: "firacode-regular",
    fontSize: 15,
    paddingTop: Platform.OS === "ios" ? 10 : 0,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFB7B2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});
