import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../supabase";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userPosts, setUserPosts] = useState([]);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "Pet Owner",
    phone: "",
    bio: "",
    avatar: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.id);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile({
          name: profileData.full_name || "",
          email: user.email || "",
          role: profileData.role || "Pet Owner",
          phone: profileData.phone || "",
          bio: profileData.bio || "",
          avatar: profileData.avatar_url || "",
        });
      }

      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (postsData) setUserPosts(postsData);
    } catch (error) {
      Alert.alert("Error", "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setProfile((p) => ({ ...p, avatar: imageUri }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from("profiles").upsert({
        id: uid,
        full_name: profile.name,
        bio: profile.bio,
        phone: profile.phone,
        avatar_url: profile.avatar,
      });
      if (error) throw error;
      setEditing(false);
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      Alert.alert("Update error", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9e85" />
      </View>
    );
  }

  if (!editing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.navBar}>
          <Ionicons
            name="chevron-back"
            size={24}
            color="black"
            onPress={() => router.back()}
          />
          <Text style={styles.navTitle}>{profile.name || "Profile"}</Text>
          <Pressable onPress={() => setEditing(true)}>
            <Text style={{ color: "#deb887", fontWeight: "bold" }}>Edit</Text>
            <Ionicons name="ellipsis-horizontal" size={24} color="black" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.headerInfo}>
            <Image
              source={
                profile.avatar
                  ? { uri: profile.avatar }
                  : require("../../assets/images/icon.png")
              }
              style={styles.mainAvatar}
            />
          </View>

          <View style={styles.bioContainer}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileBio}>
              {profile.bio || "No bio set yet."}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.postsGrid}>
            {userPosts.map((post) => (
              <View key={post.id} style={styles.postSquare}>
                <Image
                  source={{ uri: post.image_url }}
                  style={styles.postImage}
                />
              </View>
            ))}
            {userPosts.length === 0 && (
              <View style={styles.noPosts}>
                <Text style={{ color: "#999" }}>No posts yet.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.editHeader}>
        <Ionicons
          name="close"
          size={28}
          color="black"
          onPress={() => setEditing(false)}
        />
        <Text style={styles.editTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#ff9eb5" />
          ) : (
            <Ionicons name="checkmark" size={28} color="#ff9eb5" />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.editForm}>
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Pressable onPress={pickImage}>
            <Image
              source={
                profile.avatar
                  ? { uri: profile.avatar }
                  : require("../../assets/images/icon.png")
              }
              style={styles.editAvatar}
            />
            <Text style={{ color: "#deb887", marginTop: 8 }}>Change Photo</Text>
          </Pressable>
        </View>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={profile.name}
          onChangeText={(t) => setProfile((p) => ({ ...p, name: t }))}
          placeholder="Enter your name"
        />

        <Text style={styles.inputLabel}>Bio</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={profile.bio}
          onChangeText={(t) => setProfile((p) => ({ ...p, bio: t }))}
          placeholder="Tell us about you and your pets!"
          multiline
        />

        <Text style={styles.inputLabel}>Phone</Text>
        <TextInput
          style={styles.input}
          value={profile.phone}
          onChangeText={(t) => setProfile((p) => ({ ...p, phone: t }))}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />

        <Pressable
          style={styles.logoutBtn}
          onPress={() =>
            supabase.auth.signOut().then(() => router.replace("/login"))
          }
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center",
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  mainAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
  },
  bioContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  postSquare: {
    width: width / 3,
    height: width / 3,
    padding: 1,
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  noPosts: {
    width: "100%",
    alignItems: "center",
    padding: 50,
  },
  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  editForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
    fontSize: 16,
  },
  logoutBtn: {
    marginTop: 40,
    alignItems: "center",
    padding: 15,
  },
  logoutText: {
    color: "#ff5a5f",
    fontWeight: "bold",
  },
});
