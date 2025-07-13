import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as XLSX from "xlsx";
import { Text } from "../_layout";

const SETTINGS_KEY = "settings";
const RECORDS_KEY = "records";
const TASKS_KEY = "tasks";

const STATUSBAR_HEIGHT =
  Platform.OS === "android" ? RNStatusBar.currentHeight || 40 : 40;

const SettingsScreen = () => {
  const [totalHours, setTotalHours] = useState("0");
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("0");

  const { width } = useWindowDimensions();

  // Responsive sizes
  const headerFontSize = Math.max(26, Math.min(0.09 * width, 36));
  const qrSize = Math.max(90, Math.min(0.32 * width, 140));
  const qrHandleFontSize = Math.max(14, Math.min(0.05 * width, 18));
  const inputFontSize = Math.max(16, Math.min(0.055 * width, 20));
  const buttonFontSize = Math.max(15, Math.min(0.05 * width, 18));

  // Animation refs
  const headerAnim = useRef(new Animated.Value(0)).current;
  const qrAnim = useRef(new Animated.Value(0)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      headerAnim.setValue(0);
      qrAnim.setValue(0);
      inputAnim.setValue(0);
      footerAnim.setValue(0);

      Animated.stagger(120, [
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(qrAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(inputAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(footerAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, [headerAnim, qrAnim, inputAnim, footerAnim])
  );

  useEffect(() => {
    (async () => {
      const settings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.totalHours) {
          setTotalHours(parsed.totalHours.toString());
          setInputValue(parsed.totalHours.toString());
        }
      }
    })();
  }, []);

  const saveTotalHours = async (val: string) => {
    setTotalHours(val);
    setInputValue(val);
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ totalHours: val })
    );
  };

  const handleSave = () => {
    if (!inputValue || isNaN(Number(inputValue)) || Number(inputValue) <= 0) {
      Alert.alert("Please enter a valid positive number of hours.");
      return;
    }
    saveTotalHours(inputValue);
    setEditing(false);
  };

  const handleCancel = () => {
    setInputValue(totalHours);
    setEditing(false);
  };

  // Helper to format seconds to hh:mm
  const formatHoursMinutes = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Export detailed Excel (now includes tasks and photo)
  const exportToExcel = async () => {
    const data = await AsyncStorage.getItem(RECORDS_KEY);
    const settings = await AsyncStorage.getItem(SETTINGS_KEY);
    const tasksData = await AsyncStorage.getItem(TASKS_KEY);
    const records = data ? JSON.parse(data) : [];
    const tasks = tasksData ? JSON.parse(tasksData) : [];
    const totalHoursVal = settings
      ? JSON.parse(settings).totalHours || "0"
      : "0";
    if (!records.length && !tasks.length) {
      Alert.alert("No records or tasks to export.");
      return;
    }

    // Records sheet
    const detailedRows = records.map((rec: any) => {
      const timeInDate = new Date(rec.timeIn);
      const timeOutDate = rec.timeOut ? new Date(rec.timeOut) : null;
      const rendered =
        rec.renderedSeconds != null
          ? formatHoursMinutes(rec.renderedSeconds)
          : "";
      const remaining =
        rec.renderedSeconds != null
          ? formatHoursMinutes(
              Math.max(0, Number(totalHoursVal) * 3600 - rec.renderedSeconds)
            )
          : "";
      return {
        "Total Hours Needed": totalHoursVal,
        Date: timeInDate.toLocaleDateString(),
        "Time In": timeInDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        "Time Out": timeOutDate
          ? timeOutDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        Rendered: rendered,
        Remaining: remaining,
      };
    });

    // Tasks sheet (includes photo URI)
    const taskRows = tasks.map((task: any, idx: number) => ({
      "#": idx + 1,
      "Task Details": task.text || "",
      "Photo URI": task.photo || "",
      Date: task.date ? new Date(task.date).toLocaleDateString() : "",
    }));

    const wb = XLSX.utils.book_new();

    if (detailedRows.length) {
      const wsRecords = XLSX.utils.json_to_sheet(detailedRows);
      XLSX.utils.book_append_sheet(wb, wsRecords, "Records");
    }
    if (taskRows.length) {
      const wsTasks = XLSX.utils.json_to_sheet(taskRows);
      XLSX.utils.book_append_sheet(wb, wsTasks, "Tasks");
    }

    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const uri = FileSystem.cacheDirectory + "logify_export.xlsx";
    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await Sharing.shareAsync(uri, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Export Records & Tasks",
      UTI: "com.microsoft.excel.xlsx",
    });
  };

  const clearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to delete all records and settings?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(RECORDS_KEY);
            await AsyncStorage.removeItem(SETTINGS_KEY);
            await AsyncStorage.removeItem(TASKS_KEY); // Clear tasks as well
            setTotalHours("0");
            setInputValue("0");
            DeviceEventEmitter.emit("dataCleared");
            Alert.alert("All data cleared.");
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.statusBarBackground} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.content}>
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
                Settings
              </Text>
            </Animated.View>
            <Animated.View
              style={{
                opacity: qrAnim,
                transform: [
                  {
                    translateY: qrAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={styles.qrCard}>
                <QRCode value="@KJristine" size={qrSize} />
                <Text style={[styles.qrHandle, { fontSize: qrHandleFontSize }]}>
                  @KJristine
                </Text>
              </View>
            </Animated.View>
            <Animated.View
              style={{
                opacity: inputAnim,
                transform: [
                  {
                    translateY: inputAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={styles.inputSection}>
                {editing ? (
                  <View
                    style={{
                      width: "100%",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <TextInput
                      style={[
                        styles.input,
                        { flex: 1, marginRight: 8, fontSize: inputFontSize },
                      ]}
                      keyboardType="numeric"
                      value={inputValue}
                      onChangeText={setInputValue}
                      maxLength={4}
                      autoFocus
                      placeholder="Total hours"
                    />
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}
                    >
                      <Text
                        style={[
                          styles.saveButtonText,
                          { fontSize: buttonFontSize },
                        ]}
                      >
                        Save
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancel}
                    >
                      <Text
                        style={[
                          styles.cancelButtonText,
                          { fontSize: buttonFontSize },
                        ]}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.inputButton}
                    onPress={() => setEditing(true)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.inputButtonText,
                        { fontSize: inputFontSize },
                      ]}
                    >
                      SET YOUR TOTAL HOURS{totalHours ? ` (${totalHours})` : ""}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
            <View style={{ flex: 1 }} />
          </View>
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: footerAnim,
                transform: [
                  {
                    translateY: footerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.exportButton}
              onPress={exportToExcel}
            >
              <Text
                style={[styles.exportButtonText, { fontSize: buttonFontSize }]}
              >
                EXPORT RECORDS TO EXCEL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={clearAllData}>
              <Text
                style={[styles.clearButtonText, { fontSize: buttonFontSize }]}
              >
                CLEAR ALL DATA
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: STATUSBAR_HEIGHT + 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
  },
  qrCard: {
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 18,
    marginBottom: 28,
    backgroundColor: "#fff",
  },
  qrHandle: {
    marginTop: 10,
    color: "#222",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  inputSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  inputButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  inputButtonText: {
    color: "#222",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 8,
    textAlign: "center",
    backgroundColor: "#fff",
    color: "#222",
    paddingHorizontal: 10,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 6,
    height: 48,
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#bbb",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#222",
    fontWeight: "bold",
  },
  exportButton: {
    width: "100%",
    backgroundColor: "#FFC107",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#222",
  },
  exportButtonText: {
    color: "#222",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  clearButton: {
    width: "100%",
    backgroundColor: "#e53935",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#222",
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: "auto",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 18,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});

export default SettingsScreen;
