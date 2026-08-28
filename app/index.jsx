import { Link } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const DATA = [
  {
    id: "1",
    title: "Welcome to Pet Health Application!",
    subtitle:
      "Take care of your pet's health and connect with other pet lovers!",
    image: require("../assets/images/homescreen2.jpg"),
  },
  {
    id: "2",
    title: "Track Your Pet Health!",
    subtitle:
      "Keep all your pet health information and vaccinations in one secure place.",
    image: require("../assets/images/homescreen2.jpg"),
  },
  {
    id: "3",
    title: "Haven't found your buddy yet?",
    subtitle: "You are at the right place, because we offer adoptations!",
    image: require("../assets/images/homescreen2.jpg"),
  },
];

export default function Index() {
  const scrollX = useRef(new Animated.Value(0)).current;

  const PagingDots = () => {
    return (
      <View style={styles.dotContainer}>
        {DATA.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 20, 8],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={i.toString()}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity: opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    const isLastSlide = index === DATA.length - 1;

    return (
      <View style={{ width }}>
        <ImageBackground
          source={item.image}
          style={styles.slideImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.glassCard}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>

              {isLastSlide && (
                <View style={styles.buttonGroup}>
                  <Link href="/signup" asChild>
                    <Pressable style={styles.signupBtn}>
                      <Text style={styles.signupText}>Get Started!</Text>
                    </Pressable>
                  </Link>

                  <Link href="/login" asChild>
                    <Pressable style={styles.loginBtn}>
                      <Text style={styles.loginText}>Sign In</Text>
                    </Pressable>
                  </Link>
                </View>
              )}
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={DATA}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={32}
        keyExtractor={(item) => item.id}
      />
      <PagingDots />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  slideImage: {
    flex: 1,
    width: width,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-end",
    paddingBottom: 100,
  },
  glassCard: {
    marginHorizontal: 20,
    padding: 30,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 220,
  },
  title: {
    fontSize: 26,
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "firacode-bold",
    color: "#1a1a1a",
    lineHeight: 32,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
    fontFamily: "firacode-regular",
    lineHeight: 22,
  },
  buttonGroup: {
    width: "100%",
    marginTop: 10,
  },
  loginBtn: {
    height: 58,
    padding: 15,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#deb887",
  },
  loginText: {
    color: "#deb887",
    fontSize: 17,
    fontFamily: "firacode-bold",
  },
  signupBtn: {
    backgroundColor: "#deb887",
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#deb887",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  signupText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "firacode-bold",
  },
  dotContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#deb887",
    marginHorizontal: 4,
  },
});
