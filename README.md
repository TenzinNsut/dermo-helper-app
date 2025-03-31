# Dermo Helper App

A skin lesion detection app built with React, TypeScript, and ONNX Runtime for analysis of potential skin cancer.


https://github.com/user-attachments/assets/d0ee26ab-bb76-4e5f-86aa-4caf3117493b



## Features

- Capture photos using the device camera
- Select images from your photo gallery
- Analyze skin lesions for potential malignancy
- Get risk assessment with probability scores
- Simple and intuitive UI

## Technical Stack

- **Vite**: Build tool
- **TypeScript**: Programming language
- **React**: Frontend framework
- **shadcn-ui**: UI component library
- **Tailwind CSS**: Styling
- **Capacitor**: Mobile app development framework
- **ONNX Runtime Web**: Machine learning inference engine
- **TensorFlow.js**: Used for image preprocessing
- **Additional Libraries**: React Router, Recharts, React Hook Form, Lucide React, Next Themes

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dermo-helper-app.git
   cd dermo-helper-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add your ONNX model:
   Place your quantized ONNX model file in the `public/models/` directory with the name `student_model_quantized.onnx`.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Mobile Deployment (Android)

1. Build the app:
   ```bash
   npm run build
   ```

2. Sync the Capacitor project:
   ```bash
   npx cap sync
   ```

3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

4. Run on a device or emulator.

## Model Information

The app uses a quantized ONNX model (`student_model_quantized.onnx`) for skin lesion classification. The model:

- Expects 224x224 RGB images
- Uses ImageNet normalization (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
- Outputs probabilities for benign/malignant classes
- Has fallback logic if the model fails to load

## Usage

1. Launch the app
2. Capture an image or select from the gallery
3. The app will analyze the image and provide a classification:
   - Low Risk (Benign)
   - Medium Risk (Potentially Malignant)
   - High Risk (Likely Malignant)
4. Review the analysis and confidence score
5. Share or save the results (in development)

## Important Notes

- This app is for educational purposes only and is NOT a substitute for professional medical advice.
- Always consult a healthcare professional for proper diagnosis and treatment.
- The app may use a simplified fallback system if the ONNX model fails to load.

## License MIT

```sh
Clone the repository to your local machine
Run npm install to install dependencies
Run npx cap add ios and/or npx cap add android to add platforms
Run npm run build to build the web app
Run npx cap sync to sync your web build to the native platforms
Run npx cap open ios or npx cap open android to open the project in Xcode or Android Studio
Build and run on your device or simulator from there
```


## What technologies are used for this project?

This project is built with .


   -Vite (Build tool)
   -TypeScript (Programming language)
   -React (Frontend framework)
   -shadcn-ui (UI component library)
   -Tailwind CSS (Styling)
   -Capacitor (Mobile app development framework)
   -TensorFlow.js (Machine learning library)
   -@tanstack/react-query (Data fetching and state management)
   -Sonner (Toast notifications)

Additional notable libraries include:

   -React Router (Routing)
   -Recharts (Charts and graphs)
   -React Hook Form (Form management)
   -Lucide React (Icons)
   -Next Themes (Theme management)

The project is set up as a web application with mobile capabilities via Capacitor, leveraging modern web technologies for building a responsive and interactive skin cancer detection application.



