import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import React from "react";
import { Text as RNText, TextProps } from "react-native";

// Custom Text component to apply global font
export function Text(props: TextProps) {
  return (
    <RNText
      {...props}
      style={[{ fontFamily: "GeographEditBlack" }, props.style]}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    GeographEditBlack: require("../assets/fonts/GeographEditBlack.ttf"),
    GeographEditBold: require("../assets/fonts/GeographEditBold.ttf"),
    GeographEditLight: require("../assets/fonts/GeographEditLight.ttf"),
    GeographEditMedium: require("../assets/fonts/GeographEditMedium.ttf"),
    GeographEditRegular: require("../assets/fonts/GeographEditRegular.ttf"),
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
