import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../supabase";

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.log(error);
        router.replace("/login");
        return;
      }

      if (data.session) {
        router.replace("/profile");
      } else {
        router.replace("/login");
      }
    };

    handleAuth();
  }, []);

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
      <ActivityIndicator />
      <Text>Signing you in...</Text>
    </View>
  );
}