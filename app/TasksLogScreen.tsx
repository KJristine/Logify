import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Text } from "./_layout";

const STATUSBAR_HEIGHT =
  Platform.OS === "android" ? RNStatusBar.currentHeight || 40 : 40;

const TASKS_KEY = "tasks";

type Task = {
  text: string;
  photo?: string | null;
  date?: string;
};

type RootStackParamList = {
  TasksLogScreen: undefined;
  TaskDetailsScreen: { task: Task };
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TasksLogScreen = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { width } = useWindowDimensions();

  // Responsive sizes
  const headerFontSize = Math.max(26, Math.min(0.09 * width, 36));
  const monthFontSize = Math.max(13, Math.min(0.045 * width, 18));
  const cardFontSize = Math.max(16, Math.min(0.055 * width, 20));
  const dayFontSize = Math.max(18, Math.min(0.07 * width, 30));
  const paddingHorizontal = Math.max(16, Math.min(0.055 * width, 24));
  const cardHeight = Math.max(48, Math.min(0.14 * width, 64));
  const dayBoxWidth = Math.max(38, Math.min(0.13 * width, 54));
  const borderRadius = Math.max(8, Math.min(0.03 * width, 14));
  const monthContainerPaddingV = Math.max(10, Math.min(0.035 * width, 16));
  const monthContainerPaddingH = Math.max(16, Math.min(0.06 * width, 28));
  const marginBottom = Math.max(10, Math.min(0.04 * width, 18));
  const closeButtonRadius = Math.max(8, Math.min(0.03 * width, 14));
  const closeButtonPaddingV = Math.max(12, Math.min(0.045 * width, 18));
  const closeButtonMarginH = Math.max(16, Math.min(0.055 * width, 24));
  const closeButtonMarginB = Math.max(32, Math.min(0.08 * width, 48));
  const closeButtonFontSize = Math.max(15, Math.min(0.05 * width, 18));

  // Animation refs
  const headerAnim = useRef(new Animated.Value(0)).current;
  const monthAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  const getCurrentMonthName = () => months[currentMonth.getMonth()];

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // Load tasks from AsyncStorage when screen is focused or month changes
  useFocusEffect(
    useCallback(() => {
      const loadTasks = async () => {
        const data = await AsyncStorage.getItem(TASKS_KEY);
        let parsed: Task[] = data ? JSON.parse(data) : [];
        // Filter by current month if date is present
        parsed = parsed.filter((task) => {
          if (!task.date) return true;
          const d = new Date(task.date);
          return (
            d.getMonth() === currentMonth.getMonth() &&
            d.getFullYear() === currentMonth.getFullYear()
          );
        });
        setTasks(parsed.reverse());
      };
      loadTasks();
    }, [currentMonth])
  );

  // Animate sections on focus
  useFocusEffect(
    useCallback(() => {
      headerAnim.setValue(0);
      monthAnim.setValue(0);
      listAnim.setValue(0);

      Animated.stagger(120, [
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(monthAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(listAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, [headerAnim, monthAnim, listAnim])
  );

  // Helper to get day number or "D"
  const getDayLabel = (task: Task) => {
    if (task.date) {
      return new Date(task.date).getDate().toString();
    }
    return "D";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarBackground} />
      <ScrollView
        style={{ flex: 1, paddingHorizontal }}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <Text style={[styles.header, { fontSize: headerFontSize }]}>
            Tasks Log
          </Text>
        </Animated.View>

        {/* Month Navigation */}
        <Animated.View
          style={{
            opacity: monthAnim,
            transform: [
              {
                translateY: monthAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={() => navigateMonth("prev")}>
              <Ionicons name="chevron-back" size={24} color="#666" />
            </TouchableOpacity>
            <View
              style={[
                styles.monthContainer,
                {
                  borderRadius,
                  paddingVertical: monthContainerPaddingV,
                  paddingHorizontal: monthContainerPaddingH,
                  marginHorizontal: marginBottom,
                },
              ]}
            >
              <Text style={[styles.monthText, { fontSize: monthFontSize }]}>
                {getCurrentMonthName().toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigateMonth("next")}>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Tasks List */}
        <Animated.View
          style={{
            opacity: listAnim,
            transform: [
              {
                translateY: listAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.tasksList}>
            {tasks.length === 0 && (
              <Text
                style={{ color: "#888", textAlign: "center", marginTop: 20 }}
              >
                No tasks yet.
              </Text>
            )}
            {tasks.map((task, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.taskCard,
                  {
                    height: cardHeight,
                    borderRadius,
                    marginBottom,
                  },
                ]}
                onPress={() =>
                  navigation.navigate("TaskDetailsScreen", { task })
                }
              >
                <View
                  style={[
                    styles.dayBox,
                    {
                      width: dayBoxWidth,
                      borderRightWidth: 1,
                      borderRightColor: "#222",
                    },
                  ]}
                >
                  <Text style={[styles.dayText, { fontSize: dayFontSize }]}>
                    {getDayLabel(task)}
                  </Text>
                </View>
                <View style={styles.taskContent}>
                  <Text
                    style={[styles.taskTitle, { fontSize: cardFontSize }]}
                    numberOfLines={1}
                  >
                    {task.text || "TITLE"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
      {/* Close Button at the bottom */}
      <TouchableOpacity
        style={[
          styles.closeButton,
          {
            borderRadius: closeButtonRadius,
            paddingVertical: closeButtonPaddingV,
            marginHorizontal: closeButtonMarginH,
            marginBottom: closeButtonMarginB,
          },
        ]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Text
          style={[styles.closeButtonText, { fontSize: closeButtonFontSize }]}
        >
          Close
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: STATUSBAR_HEIGHT + 20,
  },
  statusBarBackground: {
    height: STATUSBAR_HEIGHT,
    backgroundColor: "#FFC107",
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
  },
  header: {
    color: "#222",
    marginBottom: 20,
    marginTop: 20,
  },
  monthNavigation: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  monthContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  monthText: {
    color: "#666",
    letterSpacing: 0.5,
  },
  tasksList: {
    marginTop: 0,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  dayBox: {
    height: "100%",
    backgroundColor: "#FFC107",
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    color: "#222",
  },
  taskContent: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: "center",
    height: "100%",
  },
  taskTitle: {
    color: "#222",
  },
  closeButton: {
    backgroundColor: "#FFC107",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  closeButtonText: {
    color: "#222",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

export default TasksLogScreen;
