import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../supabase";

export default function ChatScreen() {
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSocialData();
  }, []);

  const loadSocialData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pending } = await supabase
        .from("friendships")
        .select(
          `id, sender_id, profiles!friendships_sender_id_fkey ( full_name, avatar_url )`,
        )
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      const { data: accepted } = await supabase
        .from("friendships")
        .select(
          `
          sender_id,
          receiver_id,
          profiles!friendships_sender_id_fkey ( id, full_name, avatar_url ),
          receiver:profiles!friendships_receiver_id_fkey ( id, full_name, avatar_url )
        `,
        )
        .eq("status", "accepted")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      setRequests(pending || []);

      const formattedFriends = (accepted || []).map((f) =>
        f.sender_id === user.id ? f.receiver : f.profiles,
      );
      setFriends(formattedFriends);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", requestId);
    Alert.alert("Success", "Friend Added!");
    loadSocialData();
  };

  const ListHeader = () => (
    <View>
      <Text style={styles.headerTitle}>Messages</Text>
      {requests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Friend Requests ({requests.length})
          </Text>
          {requests.map((item) => (
            <View key={item.id} style={styles.requestCard}>
              <Text style={styles.nameText}>{item.profiles?.full_name}</Text>
              <TouchableOpacity
                onPress={() => handleRequest(item.id)}
                style={styles.acceptBtn}
              >
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.sectionTitle}>Friends</Text>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#ffb6c1" />;

  return (
    <View style={styles.container}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Text style={styles.headerTitle}>Messages</Text>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.requestCard}
            onPress={() =>
              router.push({
                pathname: "/chatRoom",
                params: { userId: item.id },
              })
            }
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{
                  uri: item.avatar_url || "https://via.placeholder.com/100",
                }}
                style={styles.avatar}
              />

              <Text style={styles.nameText}>{item.full_name}</Text>
            </View>
            <Text>Chat 💬</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No friends yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 40,
  },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 14,
    color: "#888",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  nameText: { fontSize: 16, fontWeight: "600" },
  acceptBtn: { backgroundColor: "#ffb6c1", padding: 8, borderRadius: 8 },
  btnText: { fontWeight: "bold", color: "#fff" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 20 },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
  },
  requestCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
});
