# DermoHelper

DermoHelper is a mobile application designed to assist in the early detection of skin cancer through advanced artificial intelligence. The app allows users to capture images of skin lesions and receive instant analysis using machine learning technology.

## Features

- **Image Capture**: Use your device's camera to take high-quality photos of skin lesions
- **AI Analysis**: On-device processing using a trained model to analyze skin images
- **Risk Assessment**: Receive assessment of potential risks based on image analysis
- **PDF Reports**: Generate and share detailed PDF reports of analysis results
- **Privacy-Focused**: All processing happens locally on your device with no external data transmission

## Technology Stack

- **Frontend**: React with TypeScript
- **UI Framework**: Tailwind CSS with shadcn-ui components
- **Mobile Framework**: Capacitor for cross-platform deployment
- **Machine Learning**: TensorFlow.js with ONNX Runtime for on-device inference
- **PDF Generation**: PDF creation and sharing capabilities

## Deployment Options

### Web Version

The web version of DermoHelper is available at:
[https://dermo-helper-app.vercel.app](https://dermo-helper-app.vercel.app)

### Mobile App

The Android app can be downloaded from:
[Aptoide Store](https://dermo-helper.en.aptoide.com/)

## Important Note

DermoHelper is designed as a supplementary tool to assist healthcare professionals and should not be used as a replacement for professional medical diagnosis. Always consult with a qualified healthcare provider for proper diagnosis and treatment of skin conditions.

## Development

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- For mobile development: Android Studio (for Android) or Xcode (for iOS)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/TenzinNsut/dermo-helper-app.git
   cd dermo-helper-app
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Run the development server
   ```
   npm run dev
   ```

4. Build for production
   ```
   npm run build
   ```

5. For Android development
   ```
   npx cap sync android
   npx cap open android
   ```

## License

This project is licensed under the MIT License.
