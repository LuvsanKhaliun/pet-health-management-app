import { Ionicons } from "@expo/vector-icons";
import "expo-image-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { supabase } from "../supabase";

const { width } = Dimensions.get("window");

export default function AddPetInfo() {
  const router = useRouter();

  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need access to your photos!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    const fileExt = uri.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const formData = new FormData();
    formData.append("file", {
      uri: uri,
      name: fileName,
      type: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
    });

    const { data, error } = await supabase.storage
      .from("pets")
      .upload(filePath, formData, {
        contentType: "image/jpeg",
        upsert: false,
      });
    if (error) {
      console.error("Storage Upload Error:", error.message);
      throw error;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("pets").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSavePet = async () => {
    try {
      setUploading(true);

      // Get the user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "You must be logged in to add a pet.");
        return;
      }

      let finalImageUrl = null;
      if (image) {
        finalImageUrl = await uploadImage(image);
      }

      const { error } = await supabase.from("pets").insert({
        owner_id: user.id,
        name: petName,
        species: species,
        breed: breed,
        weight: weight,
        age: age,
        image_url: finalImageUrl,
      });

      if (error) throw error;

      router.replace("/navibar/home");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setUploading(false);
    }
  };
  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Tell us about your pet! 🐾</Text>

        <Pressable style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.petPreview} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={40} color="#deb887" />
              <Text style={styles.placeholderText}>Add Photo</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputField}
            placeholder="Pet's Name"
            value={petName}
            onChangeText={setPetName}
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputField}
            placeholder="Species (e.g. Dog)"
            value={species}
            onChangeText={setSpecies}
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputField}
            placeholder="Breed"
            value={breed}
            onChangeText={setBreed}
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputField}
            placeholder="Weight (kg)"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputField}
            placeholder="Age"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />
        </View>

        <Pressable
          style={[styles.saveButton, uploading && { opacity: 0.7 }]}
          onPress={handleSavePet}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Finish</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 90,
  },
  backButton: {
    marginLeft: 20,
    marginBottom: 20,
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 25,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: "firacode-bold",
    marginBottom: 30,
    color: "#333",
    textAlign: "center",
  },
  imagePicker: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#f9f9f9",
    borderWidth: 2,
    borderColor: "#deb887",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    overflow: "hidden",
  },
  petPreview: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    alignItems: "center",
  },
  placeholderText: {
    fontFamily: "firacode-regular",
    color: "#deb887",
    marginTop: 5,
  },
  inputWrapper: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputField: {
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: "firacode-regular",
  },
  saveButton: {
    backgroundColor: "#deb887",
    width: "50%",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
  saveText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "firacode-bold",
  },
});
