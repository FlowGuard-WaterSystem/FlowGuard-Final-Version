import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// While the app is open, the in-app banner (App.tsx) is shown instead of the system banner.
// While the app is closed or in the background, the system shows the push as normal.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Asks permission and returns this device's Expo push token, or null if push isn't available. */
export async function registerForPush(): Promise<string | null> {
  try {
    if (Platform.OS === "android") {
      // Android 13+ only shows the permission prompt once a channel exists
      await Notifications.setNotificationChannelAsync("default", {
        name: "Water alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1E88E5",
      });
    }
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null; // run `npx eas-cli@latest init` once to create one
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e) {
    // Expo Go on Android (SDK 53+) can't do remote push; a development build is required
    console.log("Push registration skipped:", e);
    return null;
  }
}

/** Push received while the app is open. Returns an unsubscribe function. */
export function onPush(cb: (title: string, body: string) => void) {
  try {
    const s = Notifications.addNotificationReceivedListener((n) =>
      cb(n.request.content.title ?? "FlowGuard", n.request.content.body ?? "")
    );
    return () => s.remove();
  } catch (e) {
    console.log("Push listener unavailable:", e);
    return () => {};
  }
}

/** User tapped a push notification. Returns an unsubscribe function. */
export function onPushTap(cb: () => void) {
  try {
    const s = Notifications.addNotificationResponseReceivedListener(() => cb());
    return () => s.remove();
  } catch (e) {
    console.log("Push tap listener unavailable:", e);
    return () => {};
  }
}
