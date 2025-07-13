import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Text } from "../_layout";

const STATUSBAR_HEIGHT =
  Platform.OS === "android" ? RNStatusBar.currentHeight || 40 : 40;

type Task = {
  text: string;
  photo?: string | null;
  date?: string;
};

export default function ReportsScreen() {
  const [taskDetails, setTaskDetails] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  type RootStackParamList = {
    TasksLogScreen: undefined;
    // add other screens here if needed
  };
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { width } = useWindowDimensions();

  // Responsive sizes
  const headerFontSize = Math.max(26, Math.min(0.09 * width, 36));
  const labelFontSize = Math.max(13, Math.min(0.045 * width, 18));
  const saveButtonFontSize = Math.max(16, Math.min(0.055 * width, 20));
  const textAreaFontSize = Math.max(15, Math.min(0.045 * width, 10));
  const photoTextFontSize = Math.max(14, Math.min(0.045 * width, 16));
  const contentPaddingHorizontal = Math.max(16, Math.min(0.055 * width, 24));

  // Image picker
  const handlePhotoUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access media library is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  // Save button handler: add current taskDetails to AsyncStorage
  const handleSave = async () => {
    if (!taskDetails.trim() || !photo) {
      Alert.alert(
        "Incomplete Entry",
        "Please enter your task details and upload a documentation photo before saving."
      );
      return;
    }

    setLoading(true);

    const newTask: Task = {
      text: taskDetails.trim(),
      photo,
      date: new Date().toISOString(),
    };
    try {
      const existing = await AsyncStorage.getItem("tasks");
      const tasks = existing ? JSON.parse(existing) : [];
      tasks.push(newTask);
      await AsyncStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (e) {
      // handle error if needed
    }
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true); // Show success modal
      setTaskDetails(""); // Clear input after saving
      setPhoto(null); // Clear photo after saving
    }, 700);
  };

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: STATUSBAR_HEIGHT + 20 }]}
    >
      <View style={styles.statusBarBackground} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: contentPaddingHorizontal,
          paddingBottom: 100,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginTop: 20, marginBottom: 20 }}>
          <Text style={[styles.header, { fontSize: headerFontSize }]}>
            Tasks
          </Text>
          <TouchableOpacity
            style={styles.viewTasksButtonAbsolute}
            onPress={() => navigation.navigate("TasksLogScreen")}
          >
            <Ionicons name="eye-outline" size={20} color="#222" />
            <Text style={{ marginLeft: 6, color: "#222" }}>View Tasks</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.label, { fontSize: labelFontSize, marginBottom: 20 }]}
        >
          WHAT TASKS DID I DO ON THE REPORTED DATE?
        </Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={[
              styles.textArea,
              { fontSize: textAreaFontSize, paddingLeft: 20 },
            ]}
            multiline
            placeholder="Write in detail the tasks you have done for the day."
            placeholderTextColor="#888"
            value={taskDetails}
            onChangeText={setTaskDetails}
          />
        </View>

        <Text
          style={[
            styles.label,
            {
              fontSize: labelFontSize,
              marginBottom: 20,
              marginTop: 8,
            },
          ]}
        >
          UPLOAD YOUR DOCUMENTATION PHOTO OF TODAY’S DUTY.
        </Text>
        <TouchableOpacity
          style={styles.photoBox}
          onPress={handlePhotoUpload}
          activeOpacity={0.7}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={36} color="#888" />
              <Text style={[styles.photoText, { fontSize: photoTextFontSize }]}>
                Upload a Photo.
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text
            style={[styles.saveButtonText, { fontSize: saveButtonFontSize }]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success/Loading Modal */}
      <Modal
        visible={showSuccess || loading}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!loading) setShowSuccess(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {loading ? (
              <>
                <ActivityIndicator size={48} color="#FFC107" />
                <Text style={{ fontSize: 18, marginTop: 18, color: "#222" }}>
                  Saving...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={48} color="#4BB543" />
                <Text style={{ fontSize: 20, marginTop: 12, color: "#222" }}>
                  Task saved!
                </Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowSuccess(false)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>OK</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  },
  label: {
    color: "#222",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  viewTasksButtonAbsolute: {
    position: "absolute",
    right: 0,
    top: 6,
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  textAreaContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 28,
    minHeight: 190,
    justifyContent: "space-between",
    padding: 0,
    overflow: "hidden",
  },
  textArea: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 16,
    paddingRight: 16,
    color: "#222",
    textAlignVertical: "top",
  },
  toolbar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#000",
    backgroundColor: "#EFEFEF",
    paddingVertical: 8,
    justifyContent: "space-around",
    alignItems: "center",
  },
  toolbarIcon: {
    marginHorizontal: 8,
  },
  photoBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#000",
    height: 225,
    marginBottom: 32,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  photoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  photoText: {
    color: "#888",
    marginTop: 6,
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  saveButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "android" ? 24 : 32,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  saveButton: {
    backgroundColor: "#FFC107",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#222",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  saveButtonText: {
    color: "#222",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    minWidth: 220,
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: "#4BB543",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
});
