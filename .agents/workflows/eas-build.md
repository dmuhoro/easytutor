---
description: How to trigger an EAS build for EasyTutor
---

# EAS Build Workflow

Follow these steps to generate a real, installable Android APK for testing.

## Prerequisites
- Logged in to Expo (`npx eas-cli login`)
- Project linked to EAS (`npx eas-cli init`)

## Triggering a Build

### For Internal Testing (APK)
This generates a direct download link for an APK that can be installed on any Android device.

```bash
# Run this from the project root
npx eas build --platform android --profile preview
```

### For Development (Expo Go)
If you need a custom development client (rarely used in this MVP).

```bash
npx eas build --platform android --profile development
```

## Monitoring Progress
1. Copy the build URL from the terminal output.
2. Open it in your browser to see the build logs and status.
3. Once finished, a QR code and download link will appear on the build page.

## Post-Build Steps
1. Download the `.apk` file to your Android phone.
2. Tap the file in your downloads to install (allow "Install from unknown sources" if prompted).
3. Open "EasyTutor" from your app drawer.
