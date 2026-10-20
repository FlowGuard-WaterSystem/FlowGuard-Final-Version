import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Image, Alert, Animated, Switch, SafeAreaView, StatusBar } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { collection, addDoc, setDoc, doc, onSnapshot, query, where, serverTimestamp, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updatePassword, signInAnonymously } from "firebase/auth";
import { db, auth } from "./firebaseConfig";
import { C, FadeIn, Press, Chip, Logo, Splash, WaveHeader, Pulse, Stat, Input, Btn, Card, Head, Tag, Empty, statusColor } from "./ui";
import { registerForPush, onPush, onPushTap } from "./Notifications";
import Community from "./Community";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ChatScreen from "./ChatScreen";
import * as LocalAuthentication from "expo-local-authentication";
import { signOut } from "firebase/auth";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

// Shown until the admin adds real data to the "schedule" and "infrastructure" collections
const SUPPLY = [
  { id: "s1", area: "Soweto", day: "Mon, Wed, Fri", time: "06:00 - 10:00" },
  { id: "s2", area: "Sandton", day: "Tue, Thu", time: "10:00 - 14:00" },
  { id: "s3", area: "Alexandra", day: "Daily", time: "14:00 - 18:00" },
];
const INFRA = [
  { id: "i1", title: "Reservoir maintenance", area: "Sandton", status: "In progress", detail: "Pressure may drop until Friday." },
  { id: "i2", title: "Main pipe replacement", area: "Soweto", status: "Planned", detail: "Works start next week." },
  { id: "i3", title: "Pump station upgrade", area: "Alexandra", status: "Completed", detail: "Supply is back to normal." },
];
const TYPES = ["Burst pipe", "Leak", "No water", "Dirty water", "Low pressure"];
const STEPS = ["Pending", "In Progress", "Resolved"];
const DEFAULT_PREFS = { alerts: true, supply: true, infra: true, status: true };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEMO_STATIONS = [
  // --- Gauteng (JHB & Mogale City) ---
  { id: "m1", name: "Mogale City Municipal Offices", lat: -26.1041, lng: 27.7712, type: "municipal" },
  { id: "m2", name: "Johannesburg Water HQ", lat: -26.1858, lng: 28.0423, type: "municipal" },
  { id: "b1", name: "Soweto Community Borehole", lat: -26.2305, lng: 27.8801, type: "borehole" },
  { id: "b2", name: "Alexandra Water Point", lat: -26.1025, lng: 28.0852, type: "borehole" },
  { id: "o1", name: "Randburg Outage Station", lat: -26.0936, lng: 28.0064, type: "outage" },
  { id: "i4", name: "Rand Water Reservoir", lat: -26.2501, lng: 28.0105, type: "infra" },

  // --- Western Cape ---
  { id: "wc1", name: "City of Cape Town Water Dept", lat: -33.9249, lng: 18.4241, type: "municipal" },
  { id: "wc2", name: "Khayelitsha Outage Station", lat: -34.0403, lng: 18.6778, type: "outage" },
  { id: "wc3", name: "Bellville Emergency Borehole", lat: -33.9000, lng: 18.6333, type: "borehole" },
  { id: "wc4", name: "Theewaterskloof Dam", lat: -34.0833, lng: 19.2833, type: "infra" },

  // --- KwaZulu-Natal ---
  { id: "kzn1", name: "eThekwini Water & Sanitation", lat: -29.8587, lng: 31.0218, type: "municipal" },
  { id: "kzn2", name: "Pietermaritzburg Water Point", lat: -29.6006, lng: 30.3794, type: "outage" },
  { id: "kzn3", name: "Umhlanga Borehole", lat: -29.7241, lng: 31.0872, type: "borehole" },
  { id: "kzn4", name: "Inanda Dam Pump Station", lat: -29.6833, lng: 30.8500, type: "infra" },

  // --- Eastern Cape ---
  { id: "ec1", name: "Nelson Mandela Bay Municipality", lat: -33.9608, lng: 25.6022, type: "municipal" },
  { id: "ec2", name: "Mthatha Outage Water Point", lat: -31.5889, lng: 28.7844, type: "outage" },
  { id: "ec3", name: "East London Community Borehole", lat: -33.0292, lng: 27.8544, type: "borehole" },

  // --- Free State ---
  { id: "fs1", name: "Mangaung Metro (Bloemfontein)", lat: -29.0852, lng: 26.1596, type: "municipal" },
  { id: "fs2", name: "Welkom Water Tanker Point", lat: -27.9889, lng: 26.7311, type: "outage" },
  { id: "fs3", name: "Gariep Dam", lat: -30.6236, lng: 25.5131, type: "infra" },

  // --- Limpopo ---
  { id: "lp1", name: "Polokwane Municipality", lat: -23.9045, lng: 29.4689, type: "municipal" },
  { id: "lp2", name: "Musina Borehole", lat: -22.3443, lng: 30.0424, type: "borehole" },

  // --- Mpumalanga ---
  { id: "mp1", name: "Mbombela Municipality", lat: -25.4753, lng: 30.9694, type: "municipal" },
  { id: "mp2", name: "Secunda Outage Station", lat: -26.5000, lng: 29.1667, type: "outage" },

  // --- North West ---
  { id: "nw1", name: "Rustenburg Water Offices", lat: -25.6544, lng: 27.2558, type: "municipal" },
  { id: "nw2", name: "Mahikeng Borehole", lat: -25.8500, lng: 25.6333, type: "borehole" },

  // --- Northern Cape ---
  { id: "nc1", name: "Sol Plaatje Municipality (Kimberley)", lat: -28.7282, lng: 24.7499, type: "municipal" },
  { id: "nc2", name: "Upington Water Tanker Point", lat: -28.4478, lng: 21.2561, type: "outage" },
];
const isToday = (d: string = "") => /daily/i.test(d) || d.includes(DAYS[new Date().getDay()]);
const sameArea = (a: string = "", b: string = "") => !!b.trim() && a.toLowerCase().includes(b.trim().toLowerCase());
const fmtDate = (t: any) => (t?.seconds ? new Date(t.seconds * 1000).toLocaleDateString() : "");

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useCol(name: string, uid?: string) {
  const [d, setD] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const q = uid ? query(collection(db, name), where("uid", "==", uid)) : collection(db, name);
    return onSnapshot(
      q,
      (s) => {
        setD(s.docs.map((x) => ({ id: x.id, ...x.data() } as any)).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        setReady(true);
      },
      () => setReady(true)
    );
  }, [name, uid]);
  return { d, ready };
}

// Fires a banner when something in a collection is added or changes. The first load only seeds the list.
function useWatch(col: { d: any[]; ready: boolean }, on: boolean, sig: (x: any) => string, msg: (x: any, isNew: boolean) => string, notify: (m: string) => void) {
  const seen = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    if (!col.ready) return;
    const next = new Map<string, string>(col.d.map((x): [string, string] => [x.id, sig(x)]));
    if (seen.current && on) {
      const hit = col.d.find((x) => seen.current!.get(x.id) !== next.get(x.id));
      if (hit) { const m = msg(hit, !seen.current.has(hit.id)); if (m) notify(m); }
    }
    seen.current = next;
  }, [col.d, col.ready]);
}

// Current weather from Open-Meteo (no API key). Uses the phone's location only if already permitted.
function useWeather() {
  const [w, setW] = useState<any>(null);
  useEffect(() => {
    let off = false;
    (async () => {
      let lat = -26.2041, lng = 28.0473, mine = false;
      try {
        const p = await Location.getForegroundPermissionsAsync();
        if (p.granted) { const l = await Location.getLastKnownPositionAsync(); if (l) { lat = l.coords.latitude; lng = l.coords.longitude; mine = true; } }
      } catch {}
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code`);
        const j = await r.json();
        if (!off && j.current) setW({ t: Math.round(j.current.temperature_2m), rain: j.current.precipitation > 0 || j.current.weather_code >= 51, mine });
      } catch {}
    })();
    return () => { off = true; };
  }, []);
  return w;
}

// ---------------------------------------------------------------------------
// Auth: Register / Login
// ---------------------------------------------------------------------------

function AuthScreen() {
  const [reg, setReg] = useState(false);
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState(""); 
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

    const go = async () => {
    if (!email.trim() || pw.length < 6) return Alert.alert("Check your details", "Enter your email and a password of 6+ characters.");
    if (reg && !name.trim()) return Alert.alert("Check your details", "Please enter your full name.");
    setBusy(true);
    try {
      if (reg) {
        const c = await createUserWithEmailAndPassword(auth, email.trim(), pw);
        await setDoc(doc(db, "users", c.user.uid), { name: name.trim(), email: email.trim(), role: "resident", createdAt: serverTimestamp() }, { merge: true });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), pw);
      }
    } catch (e: any) { Alert.alert("Could not continue", e.message); }
    setBusy(false);
  };

  

  const guest = async () => {
    setBusy(true);
    try { await signInAnonymously(auth); }
    catch (e: any) {
      const message = e.code === "auth/operation-not-allowed"
        ? "Enable Anonymous sign-in in Firebase Console under Authentication > Sign-in method."
        : e.message;
      Alert.alert("Could not continue as guest", message);
    }
    finally { setBusy(false); }
  };

  const reset = async () => {
    if (!email.trim()) return Alert.alert("Enter your email above first");
    try { await sendPasswordResetEmail(auth, email.trim()); Alert.alert("Check your inbox", "We sent a password reset link."); }
    catch (e: any) { Alert.alert("Could not send link", e.message); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.pale }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }} keyboardShouldPersistTaps="handled">
        <FadeIn style={{ alignItems: "center", marginBottom: 28 }}>
          <Logo size={80} />
          <Text style={{ fontSize: 30, fontWeight: "800", color: C.navy, marginTop: 14 }}>FlowGuard</Text>
          <Text style={{ color: C.mute }}>{reg ? "Create your resident account" : "Sign in to stay informed"}</Text>
        </FadeIn>
        <FadeIn delay={150}>
          {reg && <Input placeholder="Full name" value={name} onChangeText={setName} />}
          <Input placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Input placeholder="Password (6+ characters)" secureTextEntry value={pw} onChangeText={setPw} />
          
          <Btn label={busy ? "Please wait..." : reg ? "Create account" : "Login"} onPress={go} disabled={busy} />
          
          {!reg && <Press onPress={reset} style={{ alignItems: "center", padding: 8 }}><Text style={{ color: C.mute }}>Forgot password?</Text></Press>}
          <Press onPress={() => setReg(!reg)} style={{ alignItems: "center", padding: 10 }}>
            <Text style={{ color: C.blue, fontWeight: "600" }}>{reg ? "I already have an account" : "New here? Register"}</Text>
          </Press>
          <Btn alt label={busy ? "Please wait..." : "Continue as guest"} onPress={guest} disabled={busy} />
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function Home({ alerts, issues, supply, profile, go }: any) {
  const weather = useWeather();
  const area = profile?.area || "";
  const active = alerts.filter((a: any) => a.status === "Active");
  const mineActive = area ? active.filter((a: any) => sameArea(a.area, area)) : [];
  const mySupply = area ? supply.find((s: any) => sameArea(s.area, area)) : null;
 const tiles = [
  ["Report issue", "add-circle-outline", "Report"], ["My reports", "document-text-outline", "Mine"],
  ["Water map", "map-outline", "Map"], ["Supply schedule", "calendar-outline", "Supply"],
  ["Infrastructure", "construct-outline", "Infra"], ["Community", "chatbubbles-outline", "Community"],
  ["AI Assistant", "sparkles-outline", "Chat"], // <-- Make sure this is here!
  ["Profile & settings", "person-outline", "Profile"],
];
  const headline = area
    ? mineActive.length ? `${mineActive.length} active alert${mineActive.length > 1 ? "s" : ""} in ${area}` : `No active alerts in ${area}.`
    : active.length ? `${active.length} active water alert${active.length > 1 ? "s" : ""} in your region` : "No active alerts. Water supply is normal.";

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <WaveHeader>
        <FadeIn><Text style={{ color: C.white, fontSize: 14 }}>Welcome back</Text>
          <Text style={{ color: C.white, fontSize: 28, fontWeight: "800" }}>{profile?.name || "Resident"}</Text>
          <Text style={{ color: "#D6ECFF", marginTop: 6 }}>{headline}</Text></FadeIn>
      </WaveHeader>
      <View style={{ flexDirection: "row", paddingHorizontal: 12, marginTop: -34 }}>
        <Stat label="Active alerts" value={active.length} delay={200} />
        <Stat label="Your reports" value={issues.length} delay={300} />
        <Stat label="Open reports" value={issues.filter((i: any) => i.status !== "Resolved").length} delay={400} />
      </View>
      <View style={{ padding: 16 }}>
        {!area && (
          <Card delay={350} onPress={() => go("Profile")}>
            <Text style={{ color: C.navy, fontWeight: "700" }}>Set your area</Text>
            <Text style={{ color: C.mute }}>Add your suburb in Profile to see alerts and supply times for where you live.</Text>
          </Card>
        )}
        {mySupply && (
          <Card delay={350} onPress={() => go("Supply")}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: "700", color: C.navy }}>Water supply in {mySupply.area}</Text>
              {isToday(mySupply.day) && <Tag label="Today" color={C.green} />}
            </View>
            <Text style={{ color: C.blue, fontWeight: "600", marginTop: 4 }}>{mySupply.time}</Text>
            <Text style={{ color: C.mute }}>{mySupply.day}</Text>
          </Card>
        )}
        {weather && (
          <Card delay={380}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name={weather.rain ? "rainy-outline" : "partly-sunny-outline"} size={30} color={C.blue} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontWeight: "700", color: C.navy }}>{weather.t} C {weather.mine ? "where you are" : "in Johannesburg"}</Text>
                <Text style={{ color: C.mute }}>{weather.rain ? "Wet weather. Check infrastructure updates for planned works." : "Dry conditions right now."}</Text>
              </View>
            </View>
          </Card>
        )}
        <Text style={{ fontWeight: "700", color: C.navy, fontSize: 16, marginBottom: 10 }}>Quick access</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          {tiles.map((t, i) => (
            <FadeIn key={t[2]} delay={300 + i * 70} style={{ width: "48%", marginBottom: 12 }}>
              <Press onPress={() => go(t[2])} style={{ backgroundColor: C.white, borderRadius: 16, padding: 16, elevation: 2 }}>
                <Ionicons name={t[1] as any} size={26} color={C.blue} />
                <Text style={{ marginTop: 8, fontWeight: "600", color: C.navy }}>{t[0]}</Text>
              </Press>
            </FadeIn>
          ))}
        </View>
        <Text style={{ fontWeight: "700", color: C.navy, fontSize: 16, marginVertical: 10 }}>Latest alerts</Text>
        {alerts.slice(0, 2).map((a: any, i: number) => (
          <Card key={a.id} delay={600 + i * 100} onPress={() => go("Alerts")}>
            <Text style={{ fontWeight: "700", color: C.text }}>{a.title}</Text>
            <Text style={{ color: C.mute }}>{a.area} - {a.status}</Text>
          </Card>
        ))}
        {!alerts.length && <Text style={{ color: C.mute }}>Nothing to show yet.</Text>}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Alerts and notifications (with filter)
// ---------------------------------------------------------------------------

function Alerts({ alerts, onShowMap, onBack }: any) {
  const [f, setF] = useState("All"); const [q, setQ] = useState("");
  const list = alerts.filter((a: any) => (f === "All" || a.status === f) && `${a.title} ${a.area}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Head title="Alerts and notifications" onBack={onBack} />
      <Input placeholder="Filter by title or area" value={q} onChangeText={setQ} />
      <View style={{ flexDirection: "row" }}>{["All", "Active", "Resolved"].map((x) => <Chip key={x} label={x} on={f === x} onPress={() => setF(x)} />)}</View>
      {list.map((a: any, i: number) => (
        <Card key={a.id} delay={i * 70}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontWeight: "700", fontSize: 16, color: C.text, flex: 1 }}>{a.title}</Text>
            {a.status === "Active" ? <Pulse /> : <Ionicons name="checkmark-circle-outline" size={20} color={C.green} />}
          </View>
          <Text style={{ color: C.mute, marginTop: 4 }}>{a.area} - {a.status}{a.createdAt ? ` - ${fmtDate(a.createdAt)}` : ""}</Text>
          {a.lat && a.lng ? (
            <Press onPress={() => onShowMap(a)} style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
              <Ionicons name="location-outline" size={18} color={C.blue} />
              <Text style={{ color: C.blue, fontWeight: "600", marginLeft: 4 }}>Show on map</Text>
            </Press>
          ) : null}
        </Card>
      ))}
      {!list.length && <Empty text="No alerts match." />}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Water map (affected areas) + search location
// ---------------------------------------------------------------------------

function MapScreen({ alerts, infra, focus, onBack }: any) {
  const m = useRef<MapView>(null);
  const [q, setQ] = useState(""); 
  const [showA, setShowA] = useState(true); 
  const [showI, setShowI] = useState(true);
  const [showS, setShowS] = useState(true); // New state for stations

  const fly = (lat: number, lng: number, d = 0.06) => m.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: d, longitudeDelta: d }, 800);

  useEffect(() => { if (focus) { const t = setTimeout(() => fly(focus.lat, focus.lng, 0.04), 400); return () => clearTimeout(t); } }, [focus]);

  const search = async () => {
    if (!q.trim()) return;
    const hit = alerts.find((a: any) => a.lat && `${a.area} ${a.title}`.toLowerCase().includes(q.toLowerCase()));
    try {
      const p: any = hit ? { latitude: hit.lat, longitude: hit.lng } : (await Location.geocodeAsync(q))[0];
      if (!p) return Alert.alert("Location not found");
      fly(p.latitude, p.longitude);
    } catch { Alert.alert("Search failed", "Try a suburb or street name."); }
  };
  const withPos = (l: any[]) => l.filter((a: any) => a.lat && a.lng);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Head title="Water map" onBack={onBack} />
        <Input placeholder="Search a location" value={q} onChangeText={setQ} onSubmitEditing={search} returnKeyType="search" />
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Chip label="Affected areas" on={showA} onPress={() => setShowA(!showA)} />
          <Chip label="Infrastructure" on={showI} onPress={() => setShowI(!showI)} />
          <Chip label="Stations" on={showS} onPress={() => setShowS(!showS)} />
        </View>
      </View>
            <MapView 
        ref={m} 
        style={{ flex: 1 }} 
        // UPDATED: Center of South Africa, zoomed out to show all provinces
        initialRegion={{ latitude: -28.4793, longitude: 24.6727, latitudeDelta: 15.0, longitudeDelta: 15.0 }}
      >
        
        {/* 1. Affected Areas / Alerts */}
        {showA && withPos(alerts).map((a: any) => (
          <React.Fragment key={a.id}>
            {a.status === "Active" && <Circle center={{ latitude: a.lat, longitude: a.lng }} radius={1500} fillColor="rgba(229,72,77,0.18)" strokeColor="rgba(229,72,77,0.6)" />}
            <Marker coordinate={{ latitude: a.lat, longitude: a.lng }} title={a.title} description={`${a.area} - ${a.status}`} pinColor={a.status === "Active" ? "red" : "green"} />
          </React.Fragment>
        ))}

        {/* 2. Infrastructure */}
        {showI && withPos(infra).map((a: any) => (
          <Marker key={a.id} coordinate={{ latitude: a.lat, longitude: a.lng }} title={a.title} description={a.status} pinColor="blue" />
        ))}

        {/* 3. New Demo Water Stations */}
        {showS && DEMO_STATIONS.map((s) => (
          <Marker 
            key={s.id} 
            coordinate={{ latitude: s.lat, longitude: s.lng }} 
            title={s.name} 
            description="Water Station"
          >
            {/* Custom Marker Design (Water Drop) */}
            <View style={{ backgroundColor: '#FFFFFF', padding: 6, borderRadius: 20, borderWidth: 2, borderColor: '#8E24AA', elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2 }}>
              <Ionicons name="water" size={20} color="#8E24AA" />
            </View>
          </Marker>
        ))}

      </MapView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Infrastructure updates and Water supply schedule (both searchable)
// ---------------------------------------------------------------------------

function Infra({ infra, onBack, onShowMap }: any) {
  const [q, setQ] = useState(""); const [f, setF] = useState("All");
  const list = infra.filter((i: any) => (f === "All" || i.status?.toLowerCase() === f.toLowerCase()) && `${i.title} ${i.area}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Head title="Infrastructure updates" onBack={onBack} />
      <Input placeholder="Search by area or project" value={q} onChangeText={setQ} />
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{["All", "In progress", "Planned", "Completed"].map((x) => <Chip key={x} label={x} on={f === x} onPress={() => setF(x)} />)}</View>
      {list.map((i: any, n: number) => (
        <Card key={i.id} delay={n * 70}>
          <Text style={{ fontWeight: "700", fontSize: 16, color: C.text }}>{i.title}</Text>
          <Text style={{ color: C.mute }}>{i.area}</Text>
          <Text style={{ marginVertical: 4, color: C.text }}>{i.detail}</Text>
          <Tag label={i.status} color={statusColor(i.status)} />
          {i.lat && i.lng ? (
            <Press onPress={() => onShowMap(i)} style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
              <Ionicons name="location-outline" size={18} color={C.blue} />
              <Text style={{ color: C.blue, fontWeight: "600", marginLeft: 4 }}>Show on map</Text>
            </Press>
          ) : null}
        </Card>
      ))}
      {!list.length && <Empty text="No updates match." />}
    </ScrollView>
  );
}

function Supply({ supply, area, onBack }: any) {
  const [q, setQ] = useState(area || "");
  const list = supply.filter((s: any) => s.area.toLowerCase().includes(q.toLowerCase()));
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Head title="Water supply schedule" onBack={onBack} />
      <Input placeholder="Search your area" value={q} onChangeText={setQ} />
      {list.map((s: any, n: number) => (
        <Card key={s.id} delay={n * 70}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontWeight: "700", fontSize: 16, color: C.text }}>{s.area}</Text>
            {isToday(s.day) && <Tag label="Today" color={C.green} />}
          </View>
          <Text style={{ color: C.blue, fontWeight: "600", marginTop: 4 }}>{s.time}</Text>
          <Text style={{ color: C.mute }}>{s.day}</Text>
        </Card>
      ))}
      {!list.length && <Empty text={q ? "No schedule found for that area. Clear the search to see all areas." : "No schedule yet."} />}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Report an issue (details + photo/video) and track status
// ---------------------------------------------------------------------------

function Bar({ pct }: any) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: pct, duration: 900, useNativeDriver: false }).start(); }, [pct]);
  return <View style={{ height: 8, backgroundColor: C.pale, borderRadius: 4, marginTop: 10 }}><Animated.View style={{ height: 8, borderRadius: 4, backgroundColor: C.blue, width: v.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }} /></View>;
}

function Mine({ issues, user, onBack, onReport }: any) {
  const removeReport = (issue: any) => {
    if (issue.uid !== user.uid) {
      Alert.alert("Could not delete report", "You can only delete reports you submitted.");
      return;
    }
    Alert.alert("Delete report?", "This will permanently delete your report. Its Cloudinary image may remain stored until it is removed separately.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await deleteDoc(doc(db, "issues", issue.id));
        } catch (e: any) {
          Alert.alert("Could not delete report", e?.message || "Please try again.");
        }
      } },
    ]);
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Head title="My reports" onBack={onBack} />
      {issues.map((i: any, n: number) => {
        const step = Math.max(0, STEPS.findIndex((s) => s.toLowerCase() === (i.status || "").toLowerCase()));
        return (
          <Card key={i.id} delay={n * 80}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: "700", fontSize: 16, color: C.text }}>{i.type}</Text>
              <Text style={{ color: C.mute, fontSize: 12 }}>{fmtDate(i.createdAt)}</Text>
            </View>
            {!!i.area && <Text style={{ color: C.mute }}>{i.area}</Text>}
            <Text style={{ color: C.text, marginVertical: 6 }}>{i.details}</Text>
            {i.mediaUrl && (i.mediaType === "video" ? <Text style={{ color: C.blue }}>Video attached</Text> : <Image source={{ uri: i.mediaUrl }} style={{ height: 110, borderRadius: 10, marginTop: 6 }} />)}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
              {STEPS.map((s, k) => <Text key={s} style={{ fontSize: 12, fontWeight: k === step ? "700" : "400", color: k <= step ? statusColor(STEPS[step]) : C.mute }}>{s}</Text>)}
            </View>
            <Bar pct={(step + 1) * (100 / STEPS.length)} />
            {!!i.adminNote && <Text style={{ color: C.navy, marginTop: 10 }}>Municipality: {i.adminNote}</Text>}
            {i.uid === user.uid && (
              <Press onPress={() => removeReport(i)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 12, padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={C.red} />
                <Text style={{ color: C.red, fontWeight: "600", marginLeft: 6 }}>Delete report</Text>
              </Press>
            )}
          </Card>
        );
      })}
      {!issues.length && (
        <>
          <Empty icon="document-text-outline" text="You haven't reported anything yet." />
          <Btn label="Report an issue" onPress={onReport} />
        </>
      )}
    </ScrollView>
  );
}

// Cloudinary's unsigned preset is intended for client-side uploads. Never put the API secret here.
const CLOUDINARY_CLOUD_NAME = "oxuzharg";
const CLOUDINARY_UPLOAD_PRESET = "flowguard-issues";

function Report({ user, profile, done, onBack }: any) {
  const [type, setType] = useState(""); const [area, setArea] = useState(profile?.area || ""); const [details, setDetails] = useState("");
  const [media, setMedia] = useState<any>(null); const [busy, setBusy] = useState(false);
  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.5, base64: true });
    if (!r.canceled) setMedia(r.assets[0]);
  };
  const send = async () => {
    if (!type || !details.trim()) return Alert.alert("Choose an issue type and add details");
    setBusy(true);
    try {
      let mediaUrl: string | null = null;
      let mediaPublicId: string | null = null;
      const mediaType = "image";
      if (media) {
        try {
          if (!media.base64) throw new Error("Could not read the selected photo. Please select it again.");
          const form = new FormData();
          const mimeType = media.mimeType || "image/jpeg";
          form.append("file", `data:${mimeType};base64,${media.base64}`);
          form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
          const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: form,
          });
          const uploaded = await response.json();
          if (!response.ok) throw new Error(uploaded?.error?.message || "Cloudinary rejected the upload.");
          mediaUrl = uploaded.secure_url;
          mediaPublicId = uploaded.public_id;
        } catch (e: any) {
          console.log("Cloudinary upload error:", e?.message);
          Alert.alert("Upload failed", `${e?.message || "Please try again."}\n\nThe report will be sent without the file.`);
        }
      }
      let lat: number | null = null, lng: number | null = null;
      try { const p = await Location.requestForegroundPermissionsAsync(); if (p.granted) { const l = await Location.getCurrentPositionAsync({}); lat = l.coords.latitude; lng = l.coords.longitude; } } catch {}
      await addDoc(collection(db, "issues"), { uid: user.uid, reporter: profile?.name || user.email, type, area, details: details.trim(), mediaUrl, photoUrl: mediaUrl, mediaPublicId, mediaProvider: mediaUrl ? "cloudinary" : null, mediaType, lat, lng, status: "Pending", createdAt: serverTimestamp() });
      setType(""); setDetails(""); setMedia(null); done();
    } catch (e: any) { Alert.alert("Could not send report", e.message); }
    finally { setBusy(false); }
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Head title="Report an issue" onBack={onBack} />
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{TYPES.map((t) => <Chip key={t} label={t} on={type === t} onPress={() => setType(t)} />)}</View>
      <Input placeholder="Street or area" value={area} onChangeText={setArea} />
      <Input placeholder="Describe the problem" multiline value={details} onChangeText={setDetails} style={{ height: 100, textAlignVertical: "top" }} />
      <Btn alt label={media ? "Change photo" : "Add photo"} onPress={pick} />
      {media && <Image source={{ uri: media.uri }} style={{ height: 140, borderRadius: 12, marginBottom: 12 }} />}
      <Text style={{ color: C.mute, fontSize: 12, marginBottom: 10 }}>Your location is attached if you allow it, so the team can find the problem.</Text>
      <Btn label={busy ? "Sending..." : "Submit report"} onPress={send} disabled={busy} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Manage profile / account / notification preferences
// ---------------------------------------------------------------------------

function Profile({ user, profile, prefs, setPrefs, onBack }: any) {
  const [name, setName] = useState(profile?.name || ""); const [phone, setPhone] = useState(profile?.phone || "");
  const [area, setArea] = useState(profile?.area || ""); const [pw, setPw] = useState("");
  const save = async () => { await setDoc(doc(db, "users", user.uid), { name: name.trim(), phone: phone.trim(), area: area.trim(), email: user.email }, { merge: true }); Alert.alert("Profile saved"); };
  const change = async () => {
    try { await updatePassword(user, pw); setPw(""); Alert.alert("Password changed"); }
    catch (e: any) { Alert.alert("Could not change password", "Log out and log in again, then retry. " + (e.code || "")); }
  };
  const logout = () => Alert.alert("Log out", "Do you want to log out of FlowGuard?", [
    { text: "Cancel", style: "cancel" },
    { text: "Log out", style: "destructive", onPress: async () => { try { await setDoc(doc(db, "users", user.uid), { pushToken: null }, { merge: true }); } catch {} signOut(auth); } },
  ]);
  const rows: any = [["alerts", "Water alerts"], ["supply", "Supply schedule changes"], ["infra", "Infrastructure updates"], ["status", "Report status changes"]];
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Head title="Profile and settings" onBack={onBack} />
      <Text style={{ color: C.mute, marginBottom: 8 }}>{user.email}</Text>
      <Input placeholder="Full name" value={name} onChangeText={setName} />
      <Input placeholder="Your suburb or area" value={area} onChangeText={setArea} />
      <Input placeholder="Phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Btn label="Save profile" onPress={save} />
      <Input placeholder="New password" secureTextEntry value={pw} onChangeText={setPw} />
      <Btn alt label="Change password" onPress={change} disabled={pw.length < 6} />
      <Text style={{ fontWeight: "700", color: C.navy, fontSize: 16, marginVertical: 10 }}>Notification preferences</Text>
      {rows.map(([k, l]: any) => (
        <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ color: C.text }}>{l}</Text>
          <Switch value={prefs[k]} onValueChange={(v) => setPrefs({ ...prefs, [k]: v })} trackColor={{ true: C.sky }} thumbColor={prefs[k] ? C.blue : "#ccc"} />
        </View>
      ))}
      <View style={{ height: 12 }} />
      <Btn alt label="Logout" onPress={logout} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Shell: tabs, sub-screens, notification banner
// ---------------------------------------------------------------------------

const TABS: any = [["Home", "home-outline"], ["Alerts", "notifications-outline"], ["Map", "map-outline"], ["Report", "add-circle-outline"], ["Profile", "person-outline"]];

function Main({ user }: any) {
  const [tab, setTab] = useState("Home"); const [sub, setSub] = useState<string | null>(null);
  const [prefs, setPrefsState] = useState(DEFAULT_PREFS); const [banner, setBanner] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null); const [focus, setFocus] = useState<any>(null);
  const alertsC = useCol("alerts"); const issuesC = useCol("issues", user.uid);
  const infraC = useCol("infrastructure"); const supplyC = useCol("schedule");
  const alerts = alertsC.d; const issues = issuesC.d;
  const infra = infraC.d.length ? infraC.d : INFRA; const supply = supplyC.d.length ? supplyC.d : SUPPLY;
  const slide = useRef(new Animated.Value(-120)).current; const lastBanner = useRef(0);

  const notify = useCallback((m: string) => {
    if (Date.now() - lastBanner.current < 4000) return; // avoid stacking a push and a live update for the same event
    lastBanner.current = Date.now();
    setBanner(m); slide.setValue(-120);
    Animated.sequence([Animated.spring(slide, { toValue: 0, useNativeDriver: true }), Animated.delay(3500), Animated.timing(slide, { toValue: -120, duration: 300, useNativeDriver: true })]).start(() => setBanner(null));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("prefs").then((p) => p && setPrefsState({ ...DEFAULT_PREFS, ...JSON.parse(p) }));
    const off = onSnapshot(doc(db, "users", user.uid), (s) => { const p = s.data(); setProfile(p); if (p?.prefs) setPrefsState({ ...DEFAULT_PREFS, ...p.prefs }); });
    // Push: save this device's token so the municipality can send alerts to it
    (async () => {
      try {
        const t = await registerForPush();
        if (t) await setDoc(doc(db, "users", user.uid), { pushToken: t }, { merge: true });
      } catch (e) { console.log("Push token not saved:", e); }
    })();
    const offPush = onPush((title, body) => notify(body ? `${title} - ${body}` : title));
    const offTap = onPushTap(() => { setSub(null); setTab("Alerts"); });
    return () => { off(); offPush(); offTap(); };
  }, []);

  const setPrefs = (p: any) => {
    setPrefsState(p); AsyncStorage.setItem("prefs", JSON.stringify(p));
    setDoc(doc(db, "users", user.uid), { prefs: p }, { merge: true }); // lets the server respect the user's choices
  };

  useWatch(alertsC, prefs.alerts, (a) => a.status, (a, n) => `${n ? "New alert" : "Alert updated"}: ${a.title} - ${a.area}`, notify);
  useWatch(infraC, prefs.infra, (i) => `${i.status}|${i.detail}`, (i, n) => `Infrastructure ${n ? "update" : "changed"}: ${i.title}`, notify);
  useWatch(supplyC, prefs.supply, (s) => `${s.day}|${s.time}`, (s) => `Supply schedule updated for ${s.area}`, notify);
  useWatch(issuesC, prefs.status, (i) => i.status, (i, n) => (n ? "" : `Your ${i.type} report is now ${i.status}`), notify);

  const showOnMap = (x: any) => { setFocus({ lat: x.lat, lng: x.lng, t: Date.now() }); setSub(null); setTab("Map"); };
  const go = (x: string) => (["Map", "Report", "Alerts", "Profile"].includes(x) ? (setSub(null), setTab(x)) : setSub(x));
  const back = () => setSub(null);

  let body: any;
  if (sub === "Infra") body = <Infra infra={infra} onBack={back} onShowMap={showOnMap} />;
  else if (sub === "Supply") body = <Supply supply={supply} area={profile?.area} onBack={back} />;
  else if (sub === "Mine") body = <Mine issues={issues} user={user} onBack={back} onReport={() => go("Report")} />;
  else if (sub === "Community") body = <Community user={user} profile={profile} onBack={back} />;
  else if (sub === "Chat") body = <ChatScreen onBack={back} profile={profile} alerts={alerts} issues={issues} />;
  else if (tab === "Home") body = <Home alerts={alerts} issues={issues} supply={supply} profile={profile} go={go} />;
  else if (tab === "Alerts") body = <Alerts alerts={alerts} onShowMap={showOnMap} onBack={() => { setSub(null); setTab("Home"); }} />;
  else if (tab === "Map") body = <MapScreen alerts={alerts} infra={infra} focus={focus} onBack={() => { setSub(null); setTab("Home"); }} />;
  else if (tab === "Report") body = <Report user={user} profile={profile} onBack={() => { setSub(null); setTab("Home"); }} done={() => { setTab("Home"); setSub("Mine"); }} />;
  else body = <Profile key={profile ? "loaded" : "loading"} user={user} profile={profile} prefs={prefs} setPrefs={setPrefs} onBack={() => { setSub(null); setTab("Home"); }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.pale }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}><FadeIn key={tab + sub} style={{ flex: 1 }}>{body}</FadeIn></View>
      <View style={{ flexDirection: "row", backgroundColor: C.white, paddingVertical: 8, elevation: 10 }}>
        {TABS.map(([t, ic]: any) => (
          <Press key={t} onPress={() => { setSub(null); setTab(t); }} style={{ flex: 1, alignItems: "center" }}>
            <Ionicons name={ic} size={24} color={tab === t && !sub ? C.blue : C.mute} />
            <Text style={{ fontSize: 11, color: tab === t && !sub ? C.blue : C.mute, fontWeight: tab === t ? "700" : "400" }}>{t}</Text>
          </Press>
        ))}
      </View>
      {banner && (
        <Animated.View style={{ position: "absolute", top: 40, left: 16, right: 16, backgroundColor: C.navy, padding: 14, borderRadius: 14, transform: [{ translateY: slide }], elevation: 12 }}>
          <Text style={{ color: C.white, fontWeight: "600" }}>{banner}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Lock Screen (Biometric Check on App Open)
// ---------------------------------------------------------------------------

function LockScreen({ onUnlock, onLogout }: { onUnlock: () => void; onLogout: () => void }) {
  const unlock = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // If the phone doesn't have biometrics set up, just let them in.
        onUnlock();
        return;
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock FlowGuard",
        fallbackLabel: "Use Password",
      });

      if (authResult.success) {
        onUnlock();
      }
    } catch (e) {
      // If there's an error with the sensor, let them in
      onUnlock();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.navy, justifyContent: "center", alignItems: "center" }}>
      <Logo size={100} />
      <Text style={{ color: C.white, fontSize: 24, fontWeight: "800", marginTop: 20 }}>App Locked</Text>
      <Text style={{ color: C.sky, marginBottom: 40 }}>Verify your identity to continue</Text>
      
      <View style={{ width: "80%" }}>
        <Btn label="Unlock with Biometrics" onPress={unlock} />
        <Btn alt label="Sign Out" onPress={onLogout} />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [splash, setSplash] = useState(true); 
  const [user, setUser] = useState<any>(null); 
  const [ready, setReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u); 
      setReady(true);
      if (!u) setIsUnlocked(false); 
    });
    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      {splash ? (
        <Splash onDone={() => setSplash(false)} />
      ) : !ready ? null : user && !isUnlocked ? (
        <LockScreen onUnlock={() => setIsUnlocked(true)} onLogout={() => signOut(auth)} />
      ) : user ? (
        <Main user={user} />
      ) : (
        <AuthScreen />
      )}
    </SafeAreaProvider>
  );
}