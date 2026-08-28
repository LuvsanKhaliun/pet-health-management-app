import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList
} from "react-native";
import { supabase } from "../../supabase";

export default function PostsScreen() {
  const [user, setUser] = useState(null);
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [image, setImage] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);

  const defaultAvatar =
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          id,
          created_at,
          user_id,
          image_url,
          caption,
          likes_count,
          profiles (
            full_name,
            avatar_url
          ),
          likes (
            user_id)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadComments = async (postId) => {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        caption,
        created_at,
        profiles (full_name, avatar_url)
        `,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else setComments(data);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const { error } = await supabase.from("comments").insert({
      post_id: selectedPost,
      user_id: user.id,
      content: commentText.trim(),
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setCommentText("");
      loadComments(selectedPost);
    }
  };

  const loadUser = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setUser(data?.user || null);
  };

  useEffect(() => {
    loadUser();
    loadPosts();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Please allow access to your photos.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const uploadImage = async (uri, base64) => {
    const fileName = `${user.id}/${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from("post-images")
      .upload(fileName, decode(base64), { contentType: "image/png" });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleLike = async (postId) => {
    try {
      const { error } = await supabase
        .from("likes")
        .insert({ post_id: postId, user_id: user.id });

      if (error) {
        if (error.code === "23505") {
          await supabase
            .from("likes")
            .delete()
            .match({ post_id: postId, user_id: user.id });
        } else {
          throw error;
        }
      }

      loadPosts();
    } catch (error) {
      console.error("Error toggling like:", error.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
  };

  const handleAddPost = async () => {
    if (!postText.trim() && !image) {
      Alert.alert("Error", "Please add text or an image!");
      return;
    }

    try {
      setPosting(true);
      let publicUrl = null;

      if (image) {
        publicUrl = await uploadImage(image.uri, image.base64);
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        caption: postText.trim(),
        image_url: publicUrl,
      });

      if (error) throw error;

      setPostText("");
      setImage(null);
      await loadPosts();
    } catch (error) {
      Alert.alert("Post failed", error.message || "Could not add post");
    } finally {
      setPosting(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#deb887" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>Pet Community Feed 🐾</Text>

      <View style={styles.createCard}>
        <Text style={styles.cardTitle}>Share something</Text>

        <TextInput
          style={styles.input}
          placeholder="Write about your pet today..."
          placeholderTextColor="#999"
          multiline
          value={postText}
          onChangeText={setPostText}
        />

        {image && (
          <Image
            source={{ uri: image.uri }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
              marginTop: 10,
            }}
          />
        )}

        <Pressable style={styles.ImagePickerButton} onPress={pickImage}>
          <Ionicons name="image" size={20} color="#deb887" />
          <Text style={{ color: "#deb887" }}>
            {image ? "Change photo" : "Add Photo"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.postButton, posting && { opacity: 0.7 }]}
          onPress={handleAddPost}
          disabled={posting}
        >
          {posting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={styles.postButtonText}>Post</Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.feedSection}>
        <Text style={styles.feedTitle}>Recent Posts</Text>

        {posts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={34}
              color="#deb887"
            />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to share something 🐶
            </Text>
          </View>
        ) : (
          posts.map((item) => (
            <View key={item.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image
                  source={{
                    uri: item.profiles?.avatar_url || defaultAvatar,
                  }}
                  style={styles.avatar}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {item.profiles?.full_name || "Pet Lover"}
                  </Text>
                  <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                </View>
              </View>

              <Text style={styles.postContent}>{item.caption}</Text>
              {item.image_url && (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleLike(item.id)}
                >
                  <Ionicons name="heart-outline" size={22} color="#666" />
                  <Text style={styles.actionText}>{item.likes_count || 0}</Text>
                </Pressable>

                <Pressable
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedPost(item.id);
                    loadComments(item.id);
                    setCommentModalVisible(true);
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#666" />
                  <Text style={styles.actionText}>Comment</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
        <Modal
          visible={isCommentModalVisible}
          animationType="slide"
          onRequestClose={() => setCommentModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setCommentModalVisible(false)}>
                <Ionicons name="close" size={28} color="#444" />
              </Pressable>
              <Text style={styles.modalTitle}>Comments</Text>
              <View style={{ width: 28 }} />
            </View>

            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image
                    source={{ uri: item.profiles?.avatar_url || defaultAvatar }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentBody}>
                    <Text style={styles.commentUser}>
                      {item.profiles?.full_name}
                    </Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyComments}>
                  No comments yet. Be the first!
                </Text>
              }
            />

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                value={commentText}
                onChangeText={setCommentText}
              />
              <Pressable onPress={handleAddComment}>
                <Ionicons name="send" size={24} color="#deb887" />
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fffaf5",
  },
  container: {
    padding: 18,
    paddingTop: 28,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fffaf5",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2f2f2f",
    marginBottom: 18,
  },
  createCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#444",
    marginBottom: 12,
  },
  input: {
    minHeight: 110,
    backgroundColor: "#fffaf5",
    borderWidth: 1,
    borderColor: "#f1dfca",
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    color: "#333",
    textAlignVertical: "top",
  },
  postButton: {
    marginTop: 14,
    backgroundColor: "#deb887",
    borderRadius: 14,
    paddingVertical: 13,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  feedSection: {
    marginTop: 4,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#444",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#444",
  },
  emptySubtext: {
    marginTop: 6,
    color: "#888",
    fontSize: 14,
    textAlign: "center",
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: "#f3f3f3",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    backgroundColor: "#f3f3f3",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2f2f2f",
  },
  time: {
    marginTop: 2,
    fontSize: 12,
    color: "#999",
  },
  postContent: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  modalContainer: { flex: 1, backgroundColor: "#fff", paddingTop: 50 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  commentItem: { flexDirection: "row", padding: 15, alignItems: "flex-start" },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentBody: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 12,
  },
  commentUser: { fontWeight: "700", fontSize: 13, marginBottom: 2 },
  commentText: { fontSize: 14, color: "#333" },
  commentInputRow: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  emptyComments: { textAlign: "center", marginTop: 40, color: "#999" },
});
