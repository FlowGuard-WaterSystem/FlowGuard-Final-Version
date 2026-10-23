import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";


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
      await Notifications.setNotificationChannelAsync("default", {
        name: "Water alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1E88E5",
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return null;

    //SAFEGUARD FOR EXPO GO ON ANDROID
    const isExpoGo = Constants.executionEnvironment === "storeClient";
    if (isExpoGo && Platform.OS === "android") {
      console.log("Push registration skipped: Remote push is not supported in Expo Go on Android.");
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;

    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e) {
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
