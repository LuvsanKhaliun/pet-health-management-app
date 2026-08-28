import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "../supabase";

export default function PetHealthCare() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/navibar/home");
    }
  };

  const showMoreOptions = () => {
    console.log("petId =", petId);

    if (!petId) {
      alert("petId is missing");
      return;
    }

    router.push({
      pathname: "/nutrition",
      params: { petId },
    });
  };

  const [petData, setPetData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPet = async () => {
      if (!petId) return;

      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("id", petId)
        .single();

      if (!error) setPetData(data);
    };

    fetchPet();
  }, [petId]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!petId) return;

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("pet_id", petId)
        .order("created_at", { ascending: false });

      if (!error) setTasks(data || []);
      setLoading(false);
    };

    fetchTasks();
  }, [petId]);

  const addTask = async () => {
    if (taskText.trim() === "") return;
    const { error } = await supabase.from("tasks").insert({
      pet_id: petId,
      text: taskText,
      date: selectedDate,
      completed: false,
    });

    if (!error) {
      setTasks((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          pet_id: petId,
          text: taskText,
          date: selectedDate,
          completed: false,
        },
      ]);
      setTaskText("");
    }
  };

  const toggleTask = async (id, currentStatus) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: !currentStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating task:", error.message);
      return;
    }
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !currentStatus } : task,
      ),
    );
  };

  const deleteTask = async (id) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (!error) {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    }
  };

  const getMarkedDates = () => {
    const marked = {};
    tasks.forEach((t) => {
      marked[t.date] = { marked: true, dotColor: "#FF9AA2" };
    });
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: "#FFB7B2",
    };
    return marked;
  };

  const dailyTasks = tasks.filter((t) => t.date === selectedDate);

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.iconCircle}>
            <Ionicons name="chevron-back" size={24} color="#555" />
          </Pressable>
          <Text style={styles.headerTitle}>Pet Health Care</Text>
          <Pressable
            onPress={showMoreOptions}
            style={styles.iconCircle}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#555" />
          </Pressable>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: "#FF9AA2" }]}>
            <Ionicons name="paw" size={18} color="#fff" />
            <Text style={styles.statLabel}>Species</Text>
            <Text style={styles.statValue}>{petData?.species || "Pet"}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#B2E2F2" }]}>
            <Ionicons name="calendar" size={18} color="#fff" />
            <Text style={styles.statLabel}>Age</Text>
            <Text style={styles.statValue}>
              {petData?.age ? `${petData.age} yr` : "--"}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#C7CEEA" }]}>
            <Ionicons name="fitness" size={18} color="#fff" />
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statValue}>
              {petData?.weight ? `${petData.weight}kg` : "--"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.interactiveContainer}>
        <View style={styles.calendarWrapper}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={getMarkedDates()}
            theme={{
              calendarBackground: "transparent",
              selectedDayBackgroundColor: "#FFB7B2",
              todayTextColor: "#FF9AA2",
              arrowColor: "#FF9AA2",
              textDayFontFamily: "firacode-regular",
              textMonthFontFamily: "firacode-bold",
            }}
          />
        </View>

        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Schedule: {selectedDate}</Text>
          <FlatList
            data={dailyTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.taskItem}>
                <Pressable
                  onPress={() => toggleTask(item.id, item.completed)}
                  style={styles.taskContent}
                >
                  <View
                    style={[
                      styles.checkCircle,
                      item.completed && {
                        backgroundColor: "#FFB7B2",
                        borderColor: "#FFB7B2",
                      },
                    ]}
                  >
                    {item.completed && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.taskText,
                      item.completed && styles.completedText,
                    ]}
                  >
                    {item.text}
                  </Text>
                </Pressable>
                <Pressable onPress={() => deleteTask(item.id)}>
                  <Ionicons name="trash-outline" size={18} color="#FF9AA2" />
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No plans today! 🐾</Text>
            }
            contentContainerStyle={{
              paddingBottom: 120,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.inputArea}>
            <TextInput
              style={styles.textInput}
              placeholder="What's the plan?"
              value={taskText}
              onChangeText={setTaskText}
            />
            <Pressable style={styles.sendBtn} onPress={addTask}>
              <Ionicons name="add" size={28} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  topSection: { paddingTop: 120, paddingBottom: 20 },
  header: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 100,
  },
  headerTitle: { fontSize: 22, fontFamily: "firacode-bold", color: "#444" },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  statCard: {
    width: "30%",
    borderRadius: 20,
    padding: 5,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontFamily: "firacode-regular",
  },
  statValue: { fontSize: 13, color: "#fff", fontFamily: "firacode-bold" },

  interactiveContainer: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 10,
    marginTop: -20,
  },

  calendarWrapper: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  listSection: { flex: 1, paddingHorizontal: 25, marginTop: 15 },
  listTitle: {
    fontSize: 16,
    fontFamily: "firacode-bold",
    color: "#555",
    marginBottom: 10,
  },
  taskItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#FFB7B2",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  taskText: { fontSize: 14, fontFamily: "firacode-regular", color: "#444" },
  completedText: { textDecorationLine: "line-through", color: "#bbb" },
  emptyText: {
    textAlign: "center",
    marginTop: 15,
    color: "#aaa",
    fontSize: 13,
  },

  inputArea: {
    flexDirection: "row",
    padding: 15,
    paddingBottom: Platform.OS === "ios" ? 30 : 15,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 20,
    fontFamily: "firacode-regular",
    elevation: 2,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFB7B2",
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
});
