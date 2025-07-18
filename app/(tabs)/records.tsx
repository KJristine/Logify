import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  DeviceEventEmitter,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Text } from "../_layout";

const STATUSBAR_HEIGHT =
  Platform.OS === "android" ? RNStatusBar.currentHeight || 40 : 40;

const DAILY_REQUIRED_SECONDS = 8 * 3600; // 8 hours per day

function formatHoursMinutes(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

const RecordsScreen = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<any[]>([]);
  const [totalHours, setTotalHours] = useState<number>(0); // default
  const [ongoingSeconds, setOngoingSeconds] = useState(0);

  const { width } = useWindowDimensions();

  // Responsive sizes
  const headerFontSize = Math.max(26, Math.min(0.09 * width, 36));
  const monthFontSize = Math.max(13, Math.min(0.045 * width, 18));
  const statTitleFontSize = Math.max(11, Math.min(0.035 * width, 15));
  const statValueFontSize = Math.max(22, Math.min(0.08 * width, 32));
  const timesheetTitleFontSize = Math.max(16, Math.min(0.055 * width, 22));
  const dayFontSize = Math.max(18, Math.min(0.07 * width, 30));
  const timeLabelFontSize = Math.max(10, Math.min(0.035 * width, 13));
  const timeValueFontSize = Math.max(11, Math.min(0.04 * width, 15));

  // Animation refs
  const headerAnim = useRef(new Animated.Value(0)).current;
  const monthAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const timesheetAnim = useRef(new Animated.Value(0)).current;

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

  // Load totalHours from AsyncStorage when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadTotalHours = async () => {
        const settings = await AsyncStorage.getItem("settings");
        if (settings) {
          const parsed = JSON.parse(settings);
          if (parsed.totalHours) {
            setTotalHours(Number(parsed.totalHours));
          } else {
            setTotalHours(0);
          }
        } else {
          setTotalHours(0);
        }
      };
      loadTotalHours();
    }, [])
  );

  // Load records from AsyncStorage when screen is focused or month changes
  useFocusEffect(
    React.useCallback(() => {
      const loadRecords = async () => {
        const data = await AsyncStorage.getItem("records");
        let parsed = data ? JSON.parse(data) : [];
        parsed = parsed.filter((rec: any) => {
          const d = new Date(rec.timeIn);
          return (
            d.getMonth() === currentMonth.getMonth() &&
            d.getFullYear() === currentMonth.getFullYear()
          );
        });
        setRecords(parsed);
      };
      loadRecords();
    }, [currentMonth])
  );

  // Listen for dataCleared event to reset stats and records
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("dataCleared", () => {
      setRecords([]);
      setTotalHours(0);
      setOngoingSeconds(0);
    });
    return () => sub.remove();
  }, []);

  // Animate sections on focus
  useFocusEffect(
    React.useCallback(() => {
      headerAnim.setValue(0);
      monthAnim.setValue(0);
      statsAnim.setValue(0);
      timesheetAnim.setValue(0);

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
        Animated.timing(statsAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(timesheetAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, [headerAnim, monthAnim, statsAnim, timesheetAnim])
  );

  // Ongoing timer effect (sync with Home ongoing clock-in)
  useEffect(() => {
    let interval: any;
    const checkOngoing = async () => {
      const ongoing = await AsyncStorage.getItem("ongoingClockIn");
      if (ongoing) {
        const clockInDate = new Date(ongoing);
        setOngoingSeconds(
          Math.floor((Date.now() - clockInDate.getTime()) / 1000)
        );
        interval = setInterval(() => {
          setOngoingSeconds(
            Math.floor((Date.now() - clockInDate.getTime()) / 1000)
          );
        }, 1000);
      } else {
        setOngoingSeconds(0);
      }
    };
    checkOngoing();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [records]);

  const TimesheetRow = ({
    day,
    timeIn,
    timeOut,
    rendered,
    remaining,
    isLast,
  }: {
    day: string;
    timeIn?: string;
    timeOut?: string;
    rendered?: string;
    remaining?: string;
    isLast?: boolean;
  }) => (
    <View style={[styles.timesheetRow, isLast && styles.timesheetRowLast]}>
      <View style={styles.dayNumber}>
        <Text style={[styles.dayText, { fontSize: dayFontSize }]}>{day}</Text>
      </View>
      <View style={styles.timeContent}>
        <View style={styles.timeRow}>
          <View style={styles.leftColumn}>
            <View style={styles.inlineRow}>
              <Text style={[styles.timeLabel, { fontSize: timeLabelFontSize }]}>
                TIME IN:{" "}
              </Text>
              <Text style={[styles.timeValue, { fontSize: timeValueFontSize }]}>
                {timeIn || ""}
              </Text>
            </View>
            <View style={styles.inlineRow}>
              <Text style={[styles.timeLabel, { fontSize: timeLabelFontSize }]}>
                TIME OUT:{" "}
              </Text>
              <Text style={[styles.timeValue, { fontSize: timeValueFontSize }]}>
                {timeOut || ""}
              </Text>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.inlineRow}>
              <Text style={[styles.timeLabel, { fontSize: timeLabelFontSize }]}>
                RENDERED:{" "}
              </Text>
              <Text style={[styles.timeValue, { fontSize: timeValueFontSize }]}>
                {rendered || ""}
              </Text>
            </View>
            <View style={styles.inlineRow}>
              <Text style={[styles.timeLabel, { fontSize: timeLabelFontSize }]}>
                REMAINING:{" "}
              </Text>
              <Text style={[styles.timeValue, { fontSize: timeValueFontSize }]}>
                {remaining || ""}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const StatCard = ({ title, value }: { title: string; value: string }) => (
    <View style={styles.statCard}>
      <Text style={[styles.statTitle, { fontSize: statTitleFontSize }]}>
        {title}
      </Text>
      <Text style={[styles.statValue, { fontSize: statValueFontSize }]}>
        {value}
      </Text>
    </View>
  );

  // Calculate stats
  const totalRenderedSeconds = records.reduce(
    (sum, rec) => sum + (rec.renderedSeconds || 0),
    0
  );
  const totalRequiredSeconds = totalHours * 3600;
  const remainingSeconds = Math.max(
    0,
    totalRequiredSeconds - totalRenderedSeconds
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarBackground} />
      <ScrollView
        style={styles.content}
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
            Records
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
            <View style={styles.monthContainer}>
              <Text style={[styles.monthText, { fontSize: monthFontSize }]}>
                {getCurrentMonthName().toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigateMonth("next")}>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Statistics Cards */}
        <Animated.View
          style={{
            opacity: statsAnim,
            transform: [
              {
                translateY: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                title={`TOTAL HOURS (${totalHours})`}
                value={formatHoursMinutes(totalRequiredSeconds)}
              />
              <StatCard
                title="RENDERED HOURS"
                value={formatHoursMinutes(totalRenderedSeconds)}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                title="REMAINING HOURS"
                value={formatHoursMinutes(remainingSeconds)}
              />
              <StatCard
                title="ONGOING HOURS"
                value={formatHoursMinutes(ongoingSeconds)}
              />
            </View>
          </View>
        </Animated.View>

        {/* Timesheet */}
        <Animated.View
          style={{
            opacity: timesheetAnim,
            transform: [
              {
                translateY: timesheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.timesheetContainer}>
            <Text
              style={[
                styles.timesheetTitle,
                { fontSize: timesheetTitleFontSize },
              ]}
            >
              Timesheet
            </Text>
            <View style={styles.timesheetList}>
              {records.length === 0 && (
                <Text
                  style={{ color: "#888", textAlign: "center", marginTop: 20 }}
                >
                  No records yet.
                </Text>
              )}
              {records.map((rec, idx) => {
                const timeInDate = new Date(rec.timeIn);
                const timeOutDate = rec.timeOut ? new Date(rec.timeOut) : null;
                const rendered =
                  rec.renderedSeconds != null
                    ? formatHoursMinutes(rec.renderedSeconds)
                    : "";
                const remaining =
                  rec.renderedSeconds != null
                    ? (() => {
                        const remSec = Math.max(
                          0,
                          8 * 3600 - rec.renderedSeconds
                        );
                        return formatHoursMinutes(remSec);
                      })()
                    : "";
                return (
                  <TimesheetRow
                    key={idx}
                    day={timeInDate.getDate().toString()}
                    timeIn={timeInDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    timeOut={
                      timeOutDate
                        ? timeOutDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""
                    }
                    rendered={rendered}
                    remaining={remaining}
                    isLast={idx === records.length - 1}
                  />
                );
              })}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
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
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    marginHorizontal: 15,
    backgroundColor: "#fff",
  },
  monthText: {
    color: "#666",
    letterSpacing: 0.5,
  },
  statsContainer: {
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 18,
    paddingHorizontal: 0,
    flex: 0.48,
    alignItems: "center",
    justifyContent: "center",
  },
  statTitle: {
    color: "#666",
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  statValue: {
    color: "#222",
    textAlign: "center",
    letterSpacing: 1,
  },
  timesheetContainer: {
    marginBottom: 100,
    marginTop: 10,
  },
  timesheetTitle: {
    color: "#222",
    marginBottom: 25,
  },
  timesheetList: {
    backgroundColor: "#fff",
  },
  timesheetRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  timesheetRowLast: {
    marginBottom: 0,
  },
  dayNumber: {
    width: 50,
    height: 80,
    backgroundColor: "#FFC107",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 1,
    borderRightColor: "#000",
  },
  dayText: {
    color: "#222",
  },
  timeContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftColumn: {
    flex: 1,
    paddingRight: 20,
  },
  rightColumn: {
    flex: 1,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  timeLabel: {
    color: "#666",
    fontWeight: "400",
  },
  timeValue: {
    color: "#222",
    marginLeft: 2,
    marginBottom: 0,
  },
});

export default RecordsScreen;
