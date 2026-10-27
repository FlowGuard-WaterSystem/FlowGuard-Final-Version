# FlowGuard: error fixes, before and after

This is a teaching/reference file. The **Before** examples show the problem; the **After** examples show the fix and why it helps. They are snippets, not a separate app screen. The file does not change the app's behavior.

## 1. Map search jumped to the Gulf of Guinea

### Before

The search accepted the first geocoding result without checking whether it was in South Africa:

```ts
const result = (await Location.geocodeAsync(query))[0];
if (!result) {
  Alert.alert("Location not found");
  return;
}

mapRef.current?.animateToRegion({
  latitude: result.latitude,
  longitude: result.longitude,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
});
```

If geocoding returned a bad or unexpected result near latitude/longitude `0, 0`, the map flew to the Gulf of Guinea.

### After

Ask for a South African result, then check its coordinates before moving the map:

```ts
const SOUTH_AFRICA = {
  minLatitude: -35,
  maxLatitude: -22,
  minLongitude: 16,
  maxLongitude: 33,
};

const result = (await Location.geocodeAsync(`${query}, South Africa`))[0];
if (!result) {
  Alert.alert("Location not found", "Try a South African suburb or street name.");
  return;
}

const inSouthAfrica =
  result.latitude >= SOUTH_AFRICA.minLatitude &&
  result.latitude <= SOUTH_AFRICA.maxLatitude &&
  result.longitude >= SOUTH_AFRICA.minLongitude &&
  result.longitude <= SOUTH_AFRICA.maxLongitude;

if (!inSouthAfrica) {
  Alert.alert("Location not found", "Search for a place in South Africa.");
  return;
}

mapRef.current?.animateToRegion({
  latitude: result.latitude,
  longitude: result.longitude,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
});
```

The app also needs a sensible initial region near Johannesburg and should wait until the map is ready before animating it. This avoids starting at `(0, 0)` or trying to animate before the map view has initialized.

## 2. Report map link interpreted coordinates as a place name

### Before

Formatting coordinates with the computer's regional number format can produce decimal commas. Google Maps expects decimal points in the coordinate pair.

```cshtml
<a href="https://www.google.com/maps/search/?api=1&query=@issue.Latitude,@issue.Longitude">
    View map
</a>
```

### After

Format the coordinate pair using invariant culture before adding it to the URL:

```cshtml
@using System.Globalization

@{
    var mapQuery = string.Format(
        CultureInfo.InvariantCulture,
        "{0},{1}",
        issue.Latitude,
        issue.Longitude);
}

<a href="https://www.google.com/maps/search/?api=1&query=@mapQuery">
    View map
</a>
```

Invariant formatting keeps decimal points, for example `-26.1407,27.8256`, so Maps recognizes a latitude/longitude pair.

## 3. Metro could not resolve a React Native internal module

### Before

The Metro configuration disabled package exports:

```js
config.resolver.unstable_enablePackageExports = false;
```

That setting prevented Metro from resolving `react-native/unstable-internals-do-not-use`, which `expo-asset` imports in the affected dependency combination.

### After

Remove that override and retain the normal Expo Metro configuration:

```js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push("cjs");

module.exports = config;
```

After changing Metro settings or Expo packages, restart with a cleared Metro cache:

```powershell
npx expo start --clear
```

## 4. Expo Go and project SDK versions did not match

### Error

Expo Go reported that it supported SDK 58 while the project used SDK 57. The app could not open in that Expo Go version.

### Fix

Upgrade Expo and align its native modules with the project's SDK:

```powershell
npx expo install expo@^58.0.0
npx expo install --fix
```

The project and Expo Go need compatible SDK versions. After package changes, restart Metro with `npx expo start --clear`.

## Try the examples safely

1. Keep this file as a reference; its code blocks are not executed by the app.
2. To reproduce the map issue, temporarily test the **Before** map search with an ambiguous or invalid place query in a development copy.
3. Apply the **After** checks and try the same query. A valid South African result should animate to that place; an invalid/out-of-country result should show an alert instead of moving the map to `(0, 0)`.
4. Check report links using a location with decimal coordinates. The URL should contain decimal points.
5. For Expo/Metro changes, use a development copy or branch, then restart Metro with the clear-cache command above.

These examples explain the fixes discussed for FlowGuard. They are intentionally isolated from production app code so they can be reviewed or shared without changing the running app.
