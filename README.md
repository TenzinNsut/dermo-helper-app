# DermoHelper

DermoHelper is a mobile application designed to assist in the early detection of skin cancer through advanced artificial intelligence. The app allows users to capture images of skin lesions and receive instant analysis using machine learning technology.


https://github.com/user-attachments/assets/a98eb130-4e2d-4199-8235-b6e3cace18e6

### Web Version
The web version of DermoHelper is available at:
[https://dermo-helper-app.vercel.app](https://dermo-helper-app.vercel.app)

### Mobile App
The Android app can be downloaded from:
[Aptoide Store](https://dermo-helper.en.aptoide.com/)


### Objectives
- **Develop a High-Performing Model**: Achieve high sensitivity (>90%) to minimize false negatives (missing malignant cases), while maintaining good specificity (>80%) and accuracy (>80%).
- **Optimize for Mobile Deployment**: Create a lightweight model that runs efficiently on mobile devices without sacrificing performance.
- **Build a User-Friendly App**: Develop a mobile app that allows users to capture a skin lesion image, run inference, and view the prediction (benign or malignant) with the probability.

### Key Achievements
- Trained a **Teacher Model** (EfficientNet-B4) with high sensitivity (94.39%) and good overall performance (accuracy: 80.14%, ROC-AUC: 0.9519).
- Distilled knowledge to a **Student Model** (MobileNetV3-Large) using MAG-KD, improving its performance significantly over the initial model.
- Performed **hyperparameter tuning** on the Distilled Student Model, achieving an accuracy of 86.13%, sensitivity of 88.27%, specificity of 85.61%, and ROC-AUC of 0.9539.
- Converted the model to ONNX format, optimized it with quantization, and deployed it on a mobile app using a React/Capacitor tech stack with TensorFlow.js for inference.

## Important Note

DermoHelper is designed as a supplementary tool to assist healthcare professionals and should not be used as a replacement for professional medical diagnosis. Always consult with a qualified healthcare provider for proper diagnosis and treatment of skin conditions.


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
