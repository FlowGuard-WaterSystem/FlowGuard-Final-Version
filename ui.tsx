import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const C = {
  navy: "#0A2A5E", blue: "#1E88E5", sky: "#4FC3F7", pale: "#EAF4FF", white: "#FFFFFF",
  text: "#10243E", mute: "#6B7F99", green: "#2E9E6B", orange: "#F5A623", red: "#E5484D",
};

export function FadeIn({ delay = 0, children, style }: any) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 450, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function Press({ onPress, style, children, disabled }: any) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (x: number) => Animated.spring(s, { toValue: x, useNativeDriver: true, speed: 40 }).start();
  return (
    <Pressable disabled={disabled} onPress={onPress} onPressIn={() => to(0.95)} onPressOut={() => to(1)}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Chip({ label, on, onPress }: any) {
  return (
    <Press onPress={onPress} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, marginRight: 8, marginBottom: 8, backgroundColor: on ? C.blue : C.pale }}>
      <Text style={{ color: on ? C.white : C.navy, fontWeight: "600" }}>{label}</Text>
    </Press>
  );
}

export function Logo({ size = 110 }: any) {
  const b = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(b, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(b, { toValue: 0, duration: 1100, useNativeDriver: true }),
    ])).start();
  }, []);
  const d = size * 0.36;
  return (
    <View style={{ width: size, height: size * 1.2, backgroundColor: C.blue, borderTopLeftRadius: size * 0.2, borderTopRightRadius: size * 0.2, borderBottomLeftRadius: size * 0.5, borderBottomRightRadius: size * 0.5, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: C.sky }}>
      <Animated.View style={{ transform: [{ translateY: b.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] }) }] }}>
        <View style={{ width: d, height: d, backgroundColor: C.white, borderRadius: d / 2, borderTopLeftRadius: 0, transform: [{ rotate: "-45deg" }] }} />
      </Animated.View>
      <View style={{ width: size * 0.5, height: 4, borderRadius: 2, backgroundColor: C.sky, marginTop: size * 0.16 }} />
      <View style={{ width: size * 0.32, height: 4, borderRadius: 2, backgroundColor: C.sky, marginTop: 5, opacity: 0.7 }} />
    </View>
  );
}

export function Splash({ onDone }: any) {
  const sc = useRef(new Animated.Value(0)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const rings = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.spring(sc, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    Animated.timing(tx, { toValue: 1, duration: 700, delay: 600, useNativeDriver: true }).start();
    rings.forEach((r, i) => Animated.loop(Animated.timing(r, { toValue: 1, duration: 2200, delay: i * 700, easing: Easing.out(Easing.quad), useNativeDriver: true })).start());
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" }}>
      {rings.map((r, i) => (
        <Animated.View key={i} style={{ position: "absolute", width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: C.sky, opacity: r.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }), transform: [{ scale: r.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.6] }) }] }} />
      ))}
      <Animated.View style={{ transform: [{ scale: sc }], opacity: sc }}><Logo size={120} /></Animated.View>
      <Animated.View style={{ alignItems: "center", marginTop: 36, opacity: tx, transform: [{ translateY: tx.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <Text style={{ color: C.white, fontSize: 36, fontWeight: "800", letterSpacing: 1 }}>FlowGuard</Text>
        <Text style={{ color: C.sky, fontSize: 14, marginTop: 6, letterSpacing: 0.5 }}>Know your water. Protect your community.</Text>
      </Animated.View>
    </View>
  );
}

export function WaveHeader({ children, height = 200 }: any) {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = (v: Animated.Value, ms: number) => Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    loop(a, 3500); loop(b, 5000);
  }, []);
  const wave = (v: Animated.Value, top: number, o: number) => ({
    position: "absolute" as const, width: 520, height: 520, borderRadius: 260, left: -80, top,
    backgroundColor: `rgba(255,255,255,${o})`,
    transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-50, 50] }) }],
  });
  return (
    <View style={{ height, backgroundColor: C.blue, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden", padding: 20, paddingTop: 48 }}>
      <Animated.View style={wave(a, height - 40, 0.14)} />
      <Animated.View style={wave(b, height - 20, 0.1)} />
      {children}
    </View>
  );
}

export function Pulse({ color = C.red }: any) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(v, { toValue: 1, duration: 1400, useNativeDriver: true })).start();
  }, []);
  return (
    <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{ position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: color, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }] }} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

export function Stat({ label, value, delay = 0 }: any) {
  const [n, setN] = useState(0);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const id = v.addListener(({ value: x }) => setN(Math.round(x)));
    Animated.timing(v, { toValue: Number(value) || 0, duration: 900, delay, useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [value]);
  return (
    <FadeIn delay={delay} style={{ flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 14, marginHorizontal: 4, elevation: 3 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: C.blue }}>{n}</Text>
      <Text style={{ color: C.mute, fontSize: 12 }}>{label}</Text>
    </FadeIn>
  );
}

// ---------- Shared building blocks (moved out of App.tsx so every screen can use them) ----------

export function Input(p: any) {
  return <TextInput placeholderTextColor={C.mute} {...p} style={[{ backgroundColor: C.white, borderRadius: 12, padding: 14, marginBottom: 12, color: C.text, borderWidth: 1, borderColor: "#D5E4F5" }, p.style]} />;
}

export function Btn({ label, onPress, alt, disabled }: any) {
  return (
    <Press onPress={onPress} disabled={disabled} style={{ backgroundColor: alt ? C.navy : C.blue, padding: 15, borderRadius: 12, alignItems: "center", marginBottom: 10, opacity: disabled ? 0.5 : 1 }}>
      <Text style={{ color: C.white, fontWeight: "700" }}>{label}</Text>
    </Press>
  );
}

export function Card({ children, delay = 0, onPress }: any) {
  const body = <FadeIn delay={delay} style={{ backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 }}>{children}</FadeIn>;
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

export function Head({ title, onBack }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
      {onBack && <Press onPress={onBack} style={{ marginRight: 10 }}><Ionicons name="chevron-back" size={26} color={C.navy} /></Press>}
      <Text style={{ fontSize: 24, fontWeight: "800", color: C.navy, flex: 1 }}>{title}</Text>
    </View>
  );
}

export function Tag({ label, color }: any) {
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: color + "22", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 }}>
      <Text style={{ color, fontWeight: "700", fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export function Empty({ icon = "water-outline", text }: any) {
  return (
    <View style={{ alignItems: "center", padding: 32 }}>
      <Ionicons name={icon} size={40} color={C.sky} />
      <Text style={{ color: C.mute, marginTop: 8, textAlign: "center" }}>{text}</Text>
    </View>
  );
}

export const statusColor = (s: string = "") =>
  /resolved|completed/i.test(s) ? C.green : /progress/i.test(s) ? C.orange : /active/i.test(s) ? C.red : C.mute;