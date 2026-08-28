import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [loaded, error] = useFonts({
    "firacode-regular": require("./../assets/fonts/FiraCode-Regular.ttf"),
    "firacode-medium": require("./../assets/fonts/FiraCode-Medium.ttf"),
    "firacode-bold": require("./../assets/fonts/FiraCode-Bold.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="pet-question" />
      <Stack.Screen name="addpetinfo" />

      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          gestureEnabled: false 
        }} 
      />
    </Stack>
  );
}