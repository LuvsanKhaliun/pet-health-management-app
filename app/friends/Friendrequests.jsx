import { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../supabase";

export default function FriendManager() {
  const [incomingRequests, setIncomingRequests] = useState([]);

  useEffect(() => {
    fetchIncomingRequests();
  }, []);

  const fetchIncomingRequests = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("friendships") 
      .select(
        `
            id,
            sender_id,
            profiles!friendships_sender_id_fkey (username)
        `,
      )
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (error) console.error(error);
    else setIncomingRequests(data);
  };

  const respondToRequest = async (requestId, status) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: status })
      .eq("id", requestId);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", `Request ${status}`);
      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text
        style={{ fontSize: 20, fontFamily: "firacode-bold", marginBottom: 10 }}
      >
        Incoming Friend Requests
      </Text>

      <FlatList
        data={incomingRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 10,
              borderBottomWidth: 1,
            }}
          >
            <Text>{item.profiles?.username} wants to be friends!</Text>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() => respondToRequest(item.id, "accepted")}
              >
                <Text style={{ color: "green", marginRight: 10 }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => respondToRequest(item.id, "declined")}
              >
                <Text style={{ color: "red" }}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text>No pending requests</Text>}
      />
    </View>
  );
}
