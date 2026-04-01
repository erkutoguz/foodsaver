import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

function createFloatAnimation(value, duration) {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(value, {
        toValue: 0,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    ])
  );
}

export function LandingHeroArt() {
  const bowlFloat = useRef(new Animated.Value(0)).current;
  const tomatoFloat = useRef(new Animated.Value(0)).current;
  const broccoliFloat = useRef(new Animated.Value(0)).current;
  const carrotFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bowlAnimation = createFloatAnimation(bowlFloat, 2200);
    const tomatoAnimation = createFloatAnimation(tomatoFloat, 1700);
    const broccoliAnimation = createFloatAnimation(broccoliFloat, 2000);
    const carrotAnimation = createFloatAnimation(carrotFloat, 1900);

    bowlAnimation.start();
    tomatoAnimation.start();
    broccoliAnimation.start();
    carrotAnimation.start();

    return () => {
      bowlAnimation.stop();
      tomatoAnimation.stop();
      broccoliAnimation.stop();
      carrotAnimation.stop();
    };
  }, [bowlFloat, tomatoFloat, broccoliFloat, carrotFloat]);

  return (
    <View style={styles.canvas}>
      <View style={styles.topBlob} />
      <View style={styles.sideBlob} />

      <Animated.View
        style={[
          styles.floatingChip,
          styles.tomatoChip,
          {
            transform: [
              {
                translateY: tomatoFloat.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10]
                })
              }
            ]
          }
        ]}
      >
        <Text style={styles.chipEmoji}>🍅</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingChip,
          styles.broccoliChip,
          {
            transform: [
              {
                translateY: broccoliFloat.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -14]
                })
              }
            ]
          }
        ]}
      >
        <Text style={styles.chipEmoji}>🥦</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingChip,
          styles.carrotChip,
          {
            transform: [
              {
                translateY: carrotFloat.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -12]
                })
              }
            ]
          }
        ]}
      >
        <Text style={styles.chipEmoji}>🥕</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.plateWrap,
          {
            transform: [
              {
                translateY: bowlFloat.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8]
                })
              }
            ]
          }
        ]}
      >
        <View style={styles.shadow} />
        <View style={styles.plate}>
          <View style={styles.soup}>
            <Text style={styles.mainFoodEmoji}>🥗</Text>
            <Text style={styles.smallFoodEmojiTop}>🧀</Text>
            <Text style={styles.smallFoodEmojiBottom}>🍳</Text>
          </View>
          <View style={styles.plateLip} />
        </View>
      </Animated.View>

      <View style={styles.overlayCard}>
        <Text style={styles.overlayLabel}>TODAY'S TIP</Text>
        <Text style={styles.overlayTitle}>Use items that are close to expiring first</Text>
        <Text style={styles.overlayText}>
          Foodsaver highlights them early and makes recipe decisions easier.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    height: 300,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: colors.cream,
    padding: 18,
    justifyContent: "flex-end"
  },
  topBlob: {
    position: "absolute",
    top: -18,
    right: -12,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "#ffd6c0"
  },
  sideBlob: {
    position: "absolute",
    left: -30,
    top: 48,
    width: 132,
    height: 132,
    borderRadius: 999,
    backgroundColor: "#ffe8a9"
  },
  floatingChip: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 3
  },
  tomatoChip: {
    top: 30,
    left: 26
  },
  broccoliChip: {
    top: 72,
    right: 22
  },
  carrotChip: {
    top: 132,
    left: 78
  },
  chipEmoji: {
    fontSize: 24
  },
  plateWrap: {
    alignItems: "center",
    marginBottom: 12
  },
  shadow: {
    position: "absolute",
    bottom: -2,
    width: 150,
    height: 20,
    borderRadius: 999,
    backgroundColor: "rgba(16,32,51,0.12)"
  },
  plate: {
    width: 192,
    height: 138,
    borderRadius: 999,
    backgroundColor: "#fffdf8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#efe9e0"
  },
  soup: {
    width: 148,
    height: 94,
    borderRadius: 999,
    backgroundColor: colors.tomatoSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  mainFoodEmoji: {
    fontSize: 34
  },
  smallFoodEmojiTop: {
    position: "absolute",
    top: 16,
    right: 30,
    fontSize: 18
  },
  smallFoodEmojiBottom: {
    position: "absolute",
    bottom: 16,
    left: 32,
    fontSize: 18
  },
  plateLip: {
    position: "absolute",
    bottom: 18,
    width: 142,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#f2f2ef"
  },
  overlayCard: {
    alignSelf: "center",
    width: "92%",
    borderRadius: 24,
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4
  },
  overlayLabel: {
    color: "#f9c3a8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1
  },
  overlayTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800"
  },
  overlayText: {
    color: "#d7e0ea",
    fontSize: 13,
    lineHeight: 19
  }
});
