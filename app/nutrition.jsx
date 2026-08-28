import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../supabase";
import { getNutritionAdvice } from "./aliyun";

export default function NutritionScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams();

  const [petData, setPetData] = useState(null);
  const [macros, setMacros] = useState({
    protein: "0g",
    carbs: "0g",
    fat: "0g",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  const [meals, setMeals] = useState([]);
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealType, setMealType] = useState("Morning");
  const [foodText, setFoodText] = useState("");
  const [amountText, setAmountText] = useState("");
  const [caloriesText, setCaloriesText] = useState("");

  const totalCalories = useMemo(() => {
    return meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
  }, [meals]);

  useEffect(() => {
    const loadPetAndMacros = async () => {
      if (!petId) {
        setError("No pet id provided.");
        setLoading(false);
        return;
      }

      try {
        const { data: pet, error } = await supabase
          .from("pets")
          .select("*")
          .eq("id", petId)
          .single();

        if (error || !pet) {
          setError("Pet not found.");
          setLoading(false);
          return;
        }

        setPetData(pet);

        const aiResult = await getNutritionAdvice(pet);

        if (aiResult) {
          setMacros({
            protein: aiResult.protein || "0g",
            carbs: aiResult.carbs || "0g",
            fat: aiResult.fat || "0g",
          });
        }
      } catch (err) {
        console.log("Nutrition load error:", err);
        setError("Failed to load nutrition data.");
      } finally {
        setLoading(false);
      }
    };

    loadPetAndMacros();
  }, [petId]);

  useEffect(() => {
    const fetchMeals = async () => {
      if (!petId) return;

      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("pet_id", petId)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Fetch meals error:", error);
        return;
      }

      setMeals(data || []);
    };

    fetchMeals();
  }, [petId]);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  const dailyMeals = useMemo(() => {
    const order = {
      Morning: 1,
      Afternoon: 2,
      Evening: 3,
      Snack: 4,
    };

    return meals
      .filter((meal) => meal.date === selectedDate)
      .sort((a, b) => {
        const aOrder = order[a.meal_type] || 99;
        const bOrder = order[b.meal_type] || 99;
        return aOrder - bOrder;
      });
  }, [meals, selectedDate]);

  const addMeal = async () => {
    if (!foodText.trim() || !amountText.trim() || !petId) return;

    try {
      const { data, error } = await supabase
        .from("meals")
        .insert({
          pet_id: petId,
          date: selectedDate,
          meal_type: mealType,
          food: foodText.trim(),
          amount: amountText.trim(),
          calories: parseInt(caloriesText) || 0,
          done: false,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMeals((prev) => [data, ...prev]);
      }

      setFoodText("");
      setAmountText("");
      setMealType("Morning");
      setShowMealForm(false);
      Alert.alert("Success", "Meal added!");
    } catch (err) {
      console.log("Add meal error:", err);
      Alert.alert("Error", err.message);
    }
  };

  const toggleMealDone = async (id, currentDone) => {
    try {
      const { error } = await supabase
        .from("meals")
        .update({ done: !currentDone })
        .eq("id", id);

      if (error) {
        console.log("Toggle meal error:", error);
        return;
      }

      setMeals((prev) =>
        prev.map((meal) =>
          meal.id === id ? { ...meal, done: !currentDone } : meal,
        ),
      );
    } catch (err) {
      console.log("Toggle meal error:", err);
    }
  };

  const deleteMealItem = async (id) => {
    try {
      const { error } = await supabase.from("meals").delete().eq("id", id);

      if (error) {
        console.log("Delete meal error:", error);
        return;
      }

      setMeals((prev) => prev.filter((meal) => meal.id !== id));
    } catch (err) {
      console.log("Delete meal error:", err);
    }
  };

  const goPrevWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };

  const goNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF9EB5" />
        <Text style={styles.loadingText}>
          Calculating cute nutrition plan...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={44} color="#FF9EB5" />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.safe}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={22} color="#5B4B56" />
          </Pressable>

          <Text style={styles.headerTitle}>Nutrition</Text>

          <View style={styles.petAvatarWrap}>
            {petData?.image ? (
              <Image source={{ uri: petData.image }} style={styles.petAvatar} />
            ) : (
              <View style={styles.petAvatarFallback}>
                <Ionicons name="paw" size={18} color="#5B4B56" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroName}>{petData?.name || "Your Pet"}</Text>
            <Text style={styles.heroSub}>
              {petData?.species || "Pet"} •{" "}
              {petData?.age ? `${petData.age} yr` : "--"} •{" "}
              {petData?.weight ? `${petData.weight} kg` : "--"}
            </Text>
          </View>

          <View style={styles.sparkleBubble}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
        </View>

        <View style={styles.weekCard}>
          <View style={styles.weekTop}>
            <Pressable onPress={goPrevWeek} style={styles.weekArrow}>
              <Ionicons name="chevron-back" size={18} color="#5B4B56" />
            </Pressable>

            <Text style={styles.weekTitle}>
              {getWeekLabelFromDays(weekDays)}
            </Text>

            <Pressable onPress={goNextWeek} style={styles.weekArrow}>
              <Ionicons name="chevron-forward" size={18} color="#5B4B56" />
            </Pressable>
          </View>

          <View style={styles.daysRow}>
            {weekDays.map((day) => {
              const active = selectedDate === day.fullDate;

              return (
                <Pressable
                  key={day.fullDate}
                  onPress={() => setSelectedDate(day.fullDate)}
                  style={[
                    styles.dayPill,
                    active && styles.dayPillActive,
                    day.isToday && !active && styles.dayPillToday,
                  ]}
                >
                  <Text
                    style={[styles.dayLabel, active && styles.dayLabelActive]}
                  >
                    {day.label}
                  </Text>
                  <Text
                    style={[styles.dayNumber, active && styles.dayNumberActive]}
                  >
                    {day.number}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Suggested daily macros</Text>
        <View style={styles.macroGrid}>
          <View style={[styles.macroCard, styles.cardPeach]}>
            <Text style={styles.macroEmoji}>🍗</Text>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>{macros.protein}</Text>
          </View>

          <View style={[styles.macroCard, styles.cardPink]}>
            <Text style={styles.macroEmoji}>🍚</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>{macros.carbs}</Text>
          </View>

          <View style={[styles.macroCardWide, styles.cardMint]}>
            <Text style={styles.macroEmoji}>🥑</Text>
            <Text style={styles.macroLabel}>Fat</Text>
            <Text style={styles.macroValue}>{macros.fat}</Text>
          </View>
          <View style={[styles.macroCard, styles.cardBlue]}>
            <Text style={styles.macroEmoji}>🔥</Text>
            <Text style={styles.macroLabel}>kcal Today</Text>
            <Text style={styles.macroValue}>{totalCalories}</Text>
          </View>
        </View>

        <View style={styles.mealsCard}>
          <View style={styles.mealsHeader}>
            <View>
              <Text style={styles.mealsTitle}>Meals</Text>
              <Text style={styles.mealsSubtitle}>
                {prettyDate(selectedDate)}
              </Text>
            </View>

            <View style={styles.mealsBadge}>
              <Text style={styles.mealsBadgeText}>{dailyMeals.length}</Text>
            </View>
          </View>

          {dailyMeals.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🐾</Text>
              <Text style={styles.emptyTitle}>No meals yet</Text>
              <Text style={styles.emptyText}>
                Add a meal for this day and build your pet’s plan.
              </Text>
            </View>
          ) : (
            dailyMeals.map((meal) => (
              <View key={meal.id} style={styles.mealItem}>
                <Pressable
                  style={styles.mealLeft}
                  onPress={() => toggleMealDone(meal.id, meal.done)}
                >
                  <View
                    style={[
                      styles.checkCircle,
                      meal.done && styles.checkCircleActive,
                    ]}
                  >
                    {meal.done && (
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealType}>{meal.meal_type}</Text>
                    <Text
                      style={[
                        styles.mealText,
                        meal.done && styles.mealTextDone,
                      ]}
                    >
                      {meal.food} • {meal.amount}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => deleteMealItem(meal.id)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={17} color="#FF8DA1" />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {showMealForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add a meal ✨</Text>

            <View style={styles.typeRow}>
              {["Morning", "Afternoon", "Evening", "Snack"].map((type) => {
                const active = mealType === type;

                return (
                  <Pressable
                    key={type}
                    onPress={() => setMealType(type)}
                    style={[styles.typePill, active && styles.typePillActive]}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        active && styles.typePillTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={foodText}
              onChangeText={setFoodText}
              placeholder="Food name"
              placeholderTextColor="#B2A5AE"
              style={styles.input}
            />

            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              placeholder="Amount, ex: 120 g"
              placeholderTextColor="#B2A5AE"
              style={styles.input}
            />

            <TextInput
              style={styles.input}
              value={caloriesText}
              onChangeText={setCaloriesText}
              placeholder="Calories (e.g. 150)"
              keyboardType="numeric"
            />

            <View style={styles.formButtons}>
              <Pressable
                onPress={() => setShowMealForm(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable onPress={addMeal} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save meal</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Pressable
          style={styles.addMealButton}
          onPress={() => setShowMealForm((prev) => !prev)}
        >
          <Ionicons
            name={showMealForm ? "close" : "add"}
            size={18}
            color="#fff"
          />
          <Text style={styles.addMealButtonText}>
            {showMealForm ? "Close" : "Add a meal"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekDays(weekOffset = 0) {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);

  const days = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      number: d.getDate(),
      fullDate: formatDate(d),
      isToday: formatDate(d) === formatDate(new Date()),
      monthShort: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }

  return days;
}

function getWeekLabelFromDays(days) {
  if (!days.length) return "This week";

  const first = days[0];
  const last = days[6];

  if (first.monthShort === last.monthShort) {
    return `${first.monthShort} ${first.number} - ${last.number}`;
  }

  return `${first.monthShort} ${first.number} - ${last.monthShort} ${last.number}`;
}

function prettyDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFF7FB",
  },
  container: {
    padding: 18,
    paddingBottom: 100,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: "#FFF7FB",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#7C6B75",
    fontSize: 14,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 16,
    color: "#5B4B56",
    fontSize: 15,
  },
  backButton: {
    backgroundColor: "#5B4B56",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingTop: 50,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "firacode-bold",
    color: "#5B4B56",
  },
  petAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  petAvatar: {
    width: "100%",
    height: "100%",
  },
  petAvatarFallback: {
    flex: 1,
    backgroundColor: "#FDE2EA",
    justifyContent: "center",
    alignItems: "center",
  },

  heroCard: {
    backgroundColor: "#FDE2EA",
    borderRadius: 26,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLeft: {
    flex: 1,
    marginRight: 12,
  },
  heroName: {
    fontSize: 22,
    fontFamily: "firacode-bold",
    color: "#5B4B56",
    marginBottom: 4,
  },
  heroSub: {
    color: "#7C6B75",
    fontSize: 13,
    lineHeight: 18,
  },
  sparkleBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FF9EB5",
    justifyContent: "center",
    alignItems: "center",
  },

  weekCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 14,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  weekTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  weekTitle: {
    fontSize: 14,
    fontFamily: "firacode-bold",
    color: "#5B4B56",
  },
  weekArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF4F8",
    justifyContent: "center",
    alignItems: "center",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  dayPill: {
    flex: 1,
    backgroundColor: "#FFF4F8",
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: "center",
  },
  dayPillActive: {
    backgroundColor: "#FF9EB5",
  },
  dayPillToday: {
    borderWidth: 1.5,
    borderColor: "#FFD36E",
  },
  dayLabel: {
    fontSize: 10,
    color: "#7C6B75",
    marginBottom: 3,
  },
  dayLabelActive: {
    color: "#fff",
  },
  dayNumber: {
    fontSize: 14,
    fontFamily: "firacode-bold",
    color: "#5B4B56",
  },
  dayNumberActive: {
    color: "#fff",
  },

  sectionTitle: {
    fontSize: 20,
    fontFamily: "firacode-bold",
    color: "#5B4B56",
    marginBottom: 12,
  },

  macroGrid: {
    marginBottom: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  macroCard: {
    width: "48%",
    borderRadius: 24,
    padding: 18,
    minHeight: 120,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  macroCardWide: {
    width: "48%",
    borderRadius: 24,
    padding: 18,
    minHeight: 120,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  cardPeach: {
    backgroundColor: "#FFE4D6",
  },
  cardPink: {
    backgroundColor: "#FFD3E1",
    marginTop: 0,
  },
  cardMint: {
    backgroundColor: "#DDF8E8",
    marginTop: 10,
  },
  cardBlue: {
    backgroundColor: "#e8f0ff",
  },
  macroEmoji: {
    fontSize: 22,
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 13,
    color: "#7C6B75",
    marginBottom: 6,
  },
  macroValue: {
    fontSize: 26,
    fontFamily: "firacode-bold",
    color: "#5B4B56",
  },

  mealsCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  mealsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  mealsTitle: {
    fontSize: 18,
    fontFamily: "firacode-bold",
    color: "#5B4B56",
  },
  mealsSubtitle: {
    marginTop: 3,
    color: "#9A8A94",
    fontSize: 12,
  },
  mealsBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF0B8",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  mealsBadgeText: {
    fontFamily: "firacode-bold",
    color: "#6A5A63",
    fontSize: 12,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 18,
  },
  emptyEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "firacode-bold",
    color: "#5B4B56",
    marginBottom: 4,
  },
  emptyText: {
    textAlign: "center",
    color: "#9A8A94",
    fontSize: 13,
    lineHeight: 18,
  },

  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF7FB",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  mealLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E1D1D9",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkCircleActive: {
    backgroundColor: "#FFB84D",
    borderColor: "#FFB84D",
  },
  mealType: {
    fontSize: 12,
    color: "#9A8A94",
    marginBottom: 2,
  },
  mealText: {
    fontSize: 14,
    color: "#5B4B56",
    fontFamily: "firacode-medium",
  },
  mealTextDone: {
    textDecorationLine: "line-through",
    color: "#B6A8B1",
  },
  deleteBtn: {
    width: 30,
    alignItems: "center",
  },

  formCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: "firacode-bold",
    color: "#5B4B56",
    marginBottom: 14,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  typePill: {
    backgroundColor: "#FFF4F8",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  typePillActive: {
    backgroundColor: "#FF9EB5",
  },
  typePillText: {
    color: "#7C6B75",
    fontSize: 12,
    fontFamily: "firacode-medium",
  },
  typePillTextActive: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#FFF7FB",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#5B4B56",
    marginBottom: 10,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F3EDF1",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#5B4B56",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#7C6B75",
    fontFamily: "firacode-bold",
  },
  saveBtnText: {
    color: "#fff",
    fontFamily: "firacode-bold",
  },

  addMealButton: {
    backgroundColor: "#111",
    borderRadius: 22,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addMealButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "firacode-bold",
  },
});
