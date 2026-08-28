import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../supabase";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [loaded, error] = useFonts({
    "firacode-bold": require("./../../assets/fonts/FiraCode-Bold.ttf"),
    "firacode-regular": require("./../../assets/fonts/FiraCode-Regular.ttf"),
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert("Login Error", error.message);
        return;
      }

      router.replace("/navibar/home");
    } catch (err) {
      Alert.alert("Login failed", String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!loaded && !error) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </Pressable>

      <Image
        source={require("./../../assets/images/login.jpg")}
        style={styles.topImage}
        resizeMode="cover"
      />

      <View style={styles.contentContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.headerSection}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Please enter your details to sign in
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#999"
                style={styles.icon}
              />
              <TextInput
                style={styles.inputField}
                placeholder="example@gmail.com"
                placeholderTextColor="#bbb"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#999"
                style={styles.icon}
              />
              <TextInput
                style={styles.inputField}
                placeholder="••••••••"
                placeholderTextColor="#bbb"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              (pressed || loading) && styles.loginButtonActive,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialContainer}>
            <Pressable style={styles.socialBtn}>
              <Ionicons name="logo-google" size={22} color="#333" />
            </Pressable>

            <Pressable style={styles.socialBtn}>
              <Ionicons name="logo-apple" size={22} color="#333" />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "#fff",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    // Modern Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topImage: {
    width: width,
    height: 300,
  },
  contentContainer: {
    marginTop: -40,
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 28,
    paddingTop: 30,
    flex: 1,
  },
  headerSection: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: "firacode-bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "firacode-regular",
    color: "#777",
  },
  inputSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "firacode-bold",
    color: "#333",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FB", // Subtly off-white/blue
    borderRadius: 16,
    marginBottom: 18,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    fontFamily: "firacode-regular",
    color: "#333",
  },
  forgotPassword: {
    textAlign: "right",
    color: "#deb887",
    fontFamily: "firacode-bold",
    fontSize: 13,
  },
  loginButton: {
    backgroundColor: "#deb887",
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#deb887",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  loginButtonActive: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "firacode-bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 35,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EEE",
  },
  dividerText: {
    marginHorizontal: 15,
    color: "#999",
    fontSize: 13,
    fontFamily: "firacode-regular",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  socialBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
