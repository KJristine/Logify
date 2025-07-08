import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const TIPS = [
  "Tip: Set your daily hours in Settings for a personalized experience!",
  "Did you know? You can view your productivity stats in Records.",
  "Pro tip: Take regular breaks to boost your focus.",
  "Customize your work hours anytime in Settings.",
  "Track your progress and celebrate your wins!",
];

const { width } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const [showSplash, setShowSplash] = useState(true);
  const [showTip, setShowTip] = useState(false);

  // Animation values for modal
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Pick a random tip on mount
  const randomTip = React.useMemo(
    () => TIPS[Math.floor(Math.random() * TIPS.length)],
    []
  );

  const handleAnimationFinish = () => {
    // Fade out splash
    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowSplash(false);
      setShowTip(true);
      // Animate modal in
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleDismissTip = () => {
    // Animate modal out
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowTip(false);
      router.replace("/(tabs)/home");
    });
  };

  return (
    <View style={styles.container}>
      {showSplash && (
        <Animated.View
          style={[styles.absoluteFill, { opacity: splashOpacity }]}
        >
          <LottieView
            source={require("@/assets/animations/splash.json")}
            autoPlay
            loop={false}
            style={styles.animation}
            onAnimationFinish={handleAnimationFinish}
          />
        </Animated.View>
      )}

      <Modal
        visible={showTip}
        transparent
        animationType="none"
        onRequestClose={handleDismissTip}
      >
        <TouchableWithoutFeedback onPress={handleDismissTip}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.tipCard,
                  {
                    opacity: modalOpacity,
                    transform: [{ scale: modalScale }],
                  },
                ]}
              >
                <Text style={styles.tipTitle}>💡 Daily Tip</Text>
                <Text style={styles.tipText}>{randomTip}</Text>
                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={handleDismissTip}
                >
                  <Text style={styles.dismissBtnText}>Got it!</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFCC00",
    justifyContent: "center",
    alignItems: "center",
  },
  animation: {
    width: 350,
    height: 350,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFCC00",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tipCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 32,
    width: width > 400 ? 340 : "85%",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tipTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 17,
    color: "#222",
    textAlign: "center",
    marginBottom: 24,
  },
  dismissBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  dismissBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
