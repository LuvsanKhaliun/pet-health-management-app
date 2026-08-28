import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { supabase } from "../../supabase";

export default function YesPetHomeScreen() {
  const router = useRouter();
   
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        setPets([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error.message);
        setPets([]);
      } else {
        setPets(data || []);
      }

      setLoading(false);
    };

    fetchPets();
  }, []);

  const renderPetItem = ({ item }) => (
    <Pressable
      style={styles.petCard}
      onPress={() =>
        router.push({
          pathname: "/pethealthcare",
          params: { petId: item.id },
        })
      }
    >
      <View style={styles.petImagePlaceholder}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.petImage} />
        ) : (
          <Ionicons name="paw" size={35} color="#deb887" />
        )}
      </View>

      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petBreed}>{item.breed}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color="#ccc"
        style={{ marginLeft: "auto" }}
      />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Pets</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/addpetinfo")}
        >
          <Ionicons name="add-circle" size={32} color="#deb887" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#deb887"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={pets}
          renderItem={renderPetItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No pets added yet. Tap the + to start!
            </Text>
          }
        />
      )}
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "firacode-bold",
    color: "#333",
  },
  listContent: {
    paddingHorizontal: 25,
  },
  petCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  petImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#deb887",
    overflow: "hidden",
  },

  petImage: {
    width: "100%",
    height: "100%",
  },

  petName: {
    fontSize: 18,
    color: "#333",
    fontFamily: "firacode-bold",
  },
  petBreed: {
    fontSize: 14,
    fontFamily: "firacode-regular",
    color: "#777",
  },
  emptyText: {
    textAlign: "center",
    fontFamily: "firacode-regular",
    color: "#aaa",
    marginTop: 50,
  },
});
