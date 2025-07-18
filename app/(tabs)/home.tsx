import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Text } from "../_layout";

const STATUSBAR_HEIGHT =
  Platform.OS === "android" ? RNStatusBar.currentHeight || 40 : 40;

const RECORDS_KEY = "records";
const ONGOING_KEY = "ongoingClockIn";

const HomeScreen = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockedInTime, setClockedInTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Pause/Resume state
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStart, setPauseStart] = useState<Date | null>(null);
  const [totalPaused, setTotalPaused] = useState(0);

  const { width } = useWindowDimensions();

  // Responsive sizes
  const timeFontSize = Math.max(32, Math.min(0.14 * width, 60));
  const dateFontSize = Math.max(16, Math.min(0.07 * width, 30));
  const elapsedFontSize = Math.max(18, Math.min(0.09 * width, 32));
  const clockedInFontSize = Math.max(16, Math.min(0.07 * width, 30));
  const circleSize = Math.max(90, Math.min(0.35 * width, 140));
  const circleWidth = Math.max(7, Math.min(0.035 * width, 12));
  const welcomeFontSize = Math.max(22, Math.min(0.09 * width, 36));
  const subtitleFontSize = Math.max(14, Math.min(0.05 * width, 18));
  const buttonFontSize = Math.max(16, Math.min(0.055 * width, 20));

  // Animation refs
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const timeAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  // Play animation every time Home tab is focused
  useFocusEffect(
    React.useCallback(() => {
      titleAnim.setValue(0);
      subtitleAnim.setValue(0);
      timeAnim.setValue(0);
      buttonAnim.setValue(0);

      Animated.stagger(120, [
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(timeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, [titleAnim, subtitleAnim, timeAnim, buttonAnim])
  );

  // Restore ongoing clock-in if present
  useEffect(() => {
    (async () => {
      const ongoing = await AsyncStorage.getItem(ONGOING_KEY);
      if (ongoing) {
        setIsClockedIn(true);
        const date = new Date(ongoing);
        setClockedInTime(date);
        setElapsed(Math.floor((Date.now() - date.getTime()) / 1000));
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (isClockedIn && clockedInTime && !isPaused) {
        setElapsed(
          Math.floor(
            (Date.now() - clockedInTime.getTime() - totalPaused) / 1000
          )
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isClockedIn, clockedInTime, isPaused, totalPaused]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    // Format: MONTH DAY, YEAR (all uppercase)
    return date
      .toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  };

  const formatElapsed = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Save a record to AsyncStorage
  const saveRecord = async (record: {
    timeIn: string;
    timeOut: string;
    renderedSeconds: number;
  }) => {
    try {
      const existing = await AsyncStorage.getItem(RECORDS_KEY);
      const records = existing ? JSON.parse(existing) : [];
      records.push(record);
      await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    } catch (e) {
      // handle error if needed
    }
  };

  // Handle clock in/out and save to storage
  const handleClockAction = async () => {
    if (isClockedIn && clockedInTime) {
      // Clocking out: save record
      const timeOut = new Date();
      const renderedSeconds = Math.floor(
        (timeOut.getTime() - clockedInTime.getTime() - totalPaused) / 1000
      );
      await saveRecord({
        timeIn: clockedInTime.toISOString(),
        timeOut: timeOut.toISOString(),
        renderedSeconds,
      });
      setIsClockedIn(false);
      setClockedInTime(null);
      setElapsed(0);
      setIsPaused(false);
      setPauseStart(null);
      setTotalPaused(0);
      await AsyncStorage.removeItem(ONGOING_KEY); // Remove on clock out
    } else {
      // Clocking in
      setIsClockedIn(true);
      const now = new Date();
      setClockedInTime(now);
      setElapsed(0);
      setIsPaused(false);
      setPauseStart(null);
      setTotalPaused(0);
      await AsyncStorage.setItem(ONGOING_KEY, now.toISOString()); // Save on clock in
    }
  };

  // Pause/Resume handler
  const handlePauseResume = () => {
    if (!isPaused) {
      setIsPaused(true);
      setPauseStart(new Date());
    } else {
      if (pauseStart) {
        setTotalPaused((prev) => prev + (Date.now() - pauseStart.getTime()));
      }
      setIsPaused(false);
      setPauseStart(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar background for edge-to-edge */}
      <View style={styles.statusBarBackground} />
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: titleAnim,
            transform: [
              {
                translateY: titleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <Text style={[styles.welcomeTitle, { fontSize: welcomeFontSize }]}>
            Welcome to Logify!
          </Text>
        </Animated.View>
        <Animated.View
          style={{
            opacity: subtitleAnim,
            transform: [
              {
                translateY: subtitleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <Text style={[styles.subtitle, { fontSize: subtitleFontSize }]}>
            Simple. Accurate. Internship Logging.
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: timeAnim,
            backgroundColor: "transparent",
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
            transform: [
              {
                translateY: timeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.timeContainer}>
            <Text
              style={[styles.timeText, { fontSize: timeFontSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              allowFontScaling={false}
            >
              {formatTime(currentTime)}
            </Text>
            <Text style={[styles.dateText, { fontSize: dateFontSize }]}>
              {formatDate(currentTime)}
            </Text>
          </View>
        </Animated.View>

        {isClockedIn && (
          <View style={styles.statusContainer}>
            <TouchableOpacity onPress={handlePauseResume} activeOpacity={0.7}>
              <AnimatedCircularProgress
                size={circleSize}
                width={circleWidth}
                fill={(elapsed % 3600) * (100 / 3600)}
                tintColor={isPaused ? "#BDBDBD" : "#FFC107"}
                backgroundColor="#eee5fa"
                rotation={0}
                lineCap="round"
                style={styles.timeElapsedCircle}
              >
                {() => (
                  <Text
                    style={[
                      styles.elapsedText,
                      {
                        fontSize: elapsedFontSize,
                        color: isPaused ? "#BDBDBD" : "#FFC107",
                      },
                    ]}
                  >
                    {formatElapsed(elapsed)}
                    {"\n"}
                    <Text style={{ fontSize: 12, color: "#888" }}>
                      {isPaused ? "Paused" : "Tap to Pause"}
                    </Text>
                  </Text>
                )}
              </AnimatedCircularProgress>
            </TouchableOpacity>
            <Text
              style={[styles.clockedInText, { fontSize: clockedInFontSize }]}
            >
              CLOCKED IN AT {clockedInTime ? formatTime(clockedInTime) : ""}
            </Text>
          </View>
        )}
      </View>
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            opacity: buttonAnim,
            transform: [
              {
                translateY: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleClockAction}
        >
          <Text style={[styles.actionButtonText, { fontSize: buttonFontSize }]}>
            {isClockedIn ? "Clock Out" : "Clock In"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100, // space for button
  },
  welcomeTitle: {
    color: "#222",
    marginBottom: 10,
    marginTop: 20,
  },
  subtitle: {
    color: "#444",
    marginBottom: 32,
    fontFamily: "GeographEditMedium",
  },
  timeContainer: {
    backgroundColor: "#FFC107",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 36,
    width: "100%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#000",
    minHeight: 90,
  },
  timeText: {
    color: "#222",
    textAlign: "center",
    marginBottom: 0,
    marginTop: -10,
    width: "100%",
    minWidth: 220,
  },
  dateText: {
    color: "#222",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: -10,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 36,
    marginTop: 40,
  },
  timeElapsedCircle: {
    marginBottom: 24,
  },
  elapsedText: {
    color: "#FFC107",
    textAlign: "center",
  },
  clockedInText: {
    color: "#222",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
  },
  buttonWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 30,
  },
  actionButton: {
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
  actionButtonText: {
    fontWeight: "600",
    color: "#222",
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
