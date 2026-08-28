import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../supabase";

export default function SearchUsers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const sendFriendRequest = async (receiverId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (user.id === receiverId) {
        Alert.alert("Error", "You cannot add yourself!");
        return;
      }

      const { error } = await supabase.from("friendships").insert([
        {
          sender_id: user.id,
          receiver_id: receiverId,
          status: "pending",
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          Alert.alert("Note", "Request already sent!");
        } else {
          throw error;
        }
      } else {
        Alert.alert("Success", "Friend request sent!");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSearch = async (text) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, bio, avatar_url")
      .ilike("full_name", `%${text}%`)
      .limit(10);

    if (!error) setResults(data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        placeholder="Search by username..."
        value={query}
        onChangeText={handleSearch}
        style={styles.searchInput}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <Text style={styles.username}>
              {item.full_name || "Anonymous User"}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => sendFriendRequest(item.id)}
            >
              <Text style={styles.addButtonText}>Add Friend</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          query.length > 1 ? <Text>No users found.</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    padding: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  username: {
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: "#4a90e2",
    padding: 8,
    borderRadius: 5,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
