# Agora encryption demo
This is a demo project to test out encryption on multiple platforms
with the new version of react-native-agora.

Before anything, set the APP_ID, CHANNEL_ID and TOKEN values in config.ts.
These 3 values can be obtained from the agora console.

To start the react-native part:
1) `npm i`
2) `npm start`
3) `cd ios && pod install`
4) `npm run ios` / `npm run android`. You can also run on iOS by opening the .xcworkspace
with XCode and selecting your physical device.

To start the web part: `npm run start:web`
