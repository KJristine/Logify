import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Image,
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

type Task = {
  text: string;
  photo?: string | null;
  date?: string;
};

type RootStackParamList = {
  TasksLogScreen: undefined;
  TaskDetailsScreen: { task: Task };
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) +
    " - " +
    d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
};

const TaskDetailsScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "TaskDetailsScreen">>();
  const { width } = useWindowDimensions();

  const { task } = route.params;

  // Responsive
  const headerFontSize = Math.max(26, Math.min(0.09 * width, 36));
  const cardFontSize = Math.max(16, Math.min(0.055 * width, 20));
  const labelFontSize = Math.max(13, Math.min(0.045 * width, 18));
  const photoHeight = Math.max(260, Math.min(0.6 * width, 340));
  const photoBorderRadius = Math.max(14, Math.min(0.05 * width, 18));
  const cardPadding = Math.max(14, Math.min(0.045 * width, 22));
  const cardBorderRadius = Math.max(10, Math.min(0.04 * width, 18));
  const cardMarginBottom = Math.max(18, Math.min(0.06 * width, 32));
  const closeButtonRadius = Math.max(8, Math.min(0.03 * width, 14));
  const closeButtonPaddingV = Math.max(12, Math.min(0.045 * width, 18));
  const closeButtonMarginH = Math.max(16, Math.min(0.055 * width, 24));
  const closeButtonMarginB = Math.max(32, Math.min(0.08 * width, 48));
  const closeButtonFontSize = Math.max(15, Math.min(0.05 * width, 18));
  const contentPaddingHorizontal = Math.max(16, Math.min(0.055 * width, 24));
  // Make card taller by increasing min/max height
  const cardMinHeight = Math.max(220, Math.min(0.55 * width, 340));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarBackground} />
      <View style={styles.flexGrow}>
        <ScrollView
          style={{ flex: 1, paddingHorizontal: contentPaddingHorizontal }}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={[styles.header, { fontSize: headerFontSize }]}>
            Task Details
          </Text>

          {/* Card */}
          <View
            style={[
              styles.card,
              {
                borderRadius: cardBorderRadius,
                padding: cardPadding,
                marginBottom: cardMarginBottom,
                minHeight: cardMinHeight,
                justifyContent: "flex-start",
              },
            ]}
          >
            <Text style={styles.dateText}>{formatDateTime(task.date)}</Text>
            <Text style={[styles.sectionLabel, { fontSize: labelFontSize }]}>
              What tasks did I accomplished?
            </Text>
            <Text style={[styles.taskText, { fontSize: cardFontSize }]}>
              {task.text || "No details provided."}
            </Text>
            <Text
              style={[
                styles.sectionLabel,
                { marginTop: 18, fontSize: labelFontSize },
              ]}
            >
              Photo Documentation
            </Text>
            {task.photo ? (
              <Image
                source={{ uri: task.photo }}
                style={{
                  width: "100%",
                  height: photoHeight,
                  borderRadius: photoBorderRadius,
                  borderColor: "#000",
                  borderWidth: 1,
                  marginTop: 4,
                  marginBottom: 6,
                  backgroundColor: "#ededed",
                  alignSelf: "center",
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: photoHeight,
                  borderRadius: photoBorderRadius,
                  borderColor: "#000",
                  borderWidth: 2,
                  marginTop: 4,
                  marginBottom: 6,
                  backgroundColor: "#ededed",
                  justifyContent: "center",
                  alignItems: "center",
                  alignSelf: "center",
                }}
              >
                <Ionicons name="camera-outline" size={32} color="#aaa" />
              </View>
            )}
          </View>
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
      </View>
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
  flexGrow: {
    flex: 1,
    justifyContent: "flex-start",
  },
  header: {
    color: "#222",
    marginBottom: 20,
    marginTop: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: "#222",
    backgroundColor: "#fff",
    height: "115%",
  },
  dateText: {
    fontSize: 13,
    color: "#222",
    marginBottom: 14,
    marginTop: 2,
  },
  sectionLabel: {
    color: "#222",
    marginBottom: 15,
  },
  taskText: {
    color: "#222",
    marginBottom: 8,
    lineHeight: 21,
    fontFamily: "System",
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
    letterSpacing: 0.5,
  },
});

export default TaskDetailsScreen;
