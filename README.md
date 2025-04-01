# Dermo Helper App

This project develops an application for skin lesion detection, aimed at classifying skin lesions as benign or malignant using deep learning. The application is designed to assist users in early detection of skin cancer by leveraging a lightweight, efficient model suitable for mobile deployment. The project involves training a teacher model, distilling knowledge to a student model using Multi-Attention Guided Knowledge Distillation (MAG-KD), optimizing the student model through hyperparameter tuning, and deploying it on a mobile device using a web-based tech stack with Capacitor for cross-platform support.

https://github.com/user-attachments/assets/d0ee26ab-bb76-4e5f-86aa-4caf3117493b

### Key Achievements
- Trained a **Teacher Model** (EfficientNet-B4) with high sensitivity (94.39%) and good overall performance (accuracy: 80.14%, ROC-AUC: 0.9519).
- Distilled knowledge to a **Student Model** (MobileNetV3-Large) using MAG-KD, improving its performance significantly over the initial model.
- Performed **hyperparameter tuning** on the Distilled Student Model, achieving an accuracy of 86.13%, sensitivity of 88.27%, specificity of 85.61%, and ROC-AUC of 0.9539.
- Converted the model to ONNX format, optimized it with quantization, and deployed it on a mobile app using a React/Capacitor tech stack with TensorFlow.js for inference.

## Features

- Capture photos using the device camera
- Select images from your photo gallery
- Analyze skin lesions for potential malignancy
- Get risk assessment with probability scores
- Simple and intuitive UI

## Methodology

### Step 1: Data Preparation
- Used a dataset of skin lesion images labeled as benign or malignant (1002 test samples: 806 benign, 196 malignant).
- Preprocessed images: resized to 224x224, normalized with ImageNet mean (`[0.485, 0.456, 0.406]`) and std (`[0.229, 0.224, 0.225]`).

### Step 2: Teacher Model Training
- **Model**: EfficientNet-B4, a high-performing model for image classification.
- **Training**:
  - Used Focal Loss with class weights `[1.0, 4.0]` to handle class imbalance (more weight to the malignant class).
  - Fine-tuned with a learning rate of 0.00001 to reduce overfitting.
- **Performance (Threshold 0.5)**:
  - Accuracy: 80.14%
  - Sensitivity (Recall for Malignant): 94.39%
  - Specificity (Recall for Benign): 76.67%
  - Precision for Malignant: 0.50
  - F1-Score for Malignant: 0.65
  - ROC-AUC: 0.9519

### Step 3: Initial Student Model
- **Model**: MobileNetV3-Large, a lightweight model suitable for mobile deployment.
- **Performance (Before Distillation)**:
  - Accuracy: 62.38%
  - Sensitivity: 55%
  - Specificity: 64%
  - Precision for Malignant: 0.27
  - F1-Score for Malignant: 0.36
- **Observation**: Poor performance, not suitable for deployment.

### Step 4: Knowledge Distillation with MAG-KD

#### Overview of MAG-KD
**MAG-KD (Multi-Attention Guided Knowledge Distillation)** is an advanced knowledge distillation technique that transfers knowledge from a larger, high-performing teacher model to a smaller, efficient student model. Unlike traditional knowledge distillation, which focuses solely on matching the teacher’s output logits (soft labels), MAG-KD incorporates multiple levels of guidance, including attention maps and intermediate feature representations, to improve the student model’s performance. This approach is particularly effective for tasks like image classification, where attention mechanisms can highlight important regions in the input data (e.g., skin lesions in our case).

#### Components of MAG-KD
MAG-KD consists of three main loss components, combined with weighted coefficients:
1. **Classification Loss (`alpha`)**:
   - Uses Focal Loss to train the student model on the ground truth labels.
   - Focal Loss addresses class imbalance by focusing on hard-to-classify examples (e.g., malignant cases in our dataset).
   - Class weights `[1.0, 4.0]` were used to give more importance to the minority class (malignant).
2. **Knowledge Distillation Loss (`beta`)**:
   - Matches the student’s softened logits (using a temperature parameter) to the teacher’s softened logits.
   - The KL-Divergence loss is used, scaled by the temperature squared (`T^2`), to ensure the student learns the teacher’s probability distribution.
   - Temperature (`T=5.0`) was used to soften the logits, making the distribution more informative for the student.
3. **Attention Alignment Loss (`gamma`)**:
   - Aligns the student’s attention maps with the teacher’s attention maps.
   - The teacher model provides segmentation-like attention maps (e.g., highlighting the lesion area), which are downsampled to match the student’s attention map size (7x7 in our case).
   - Mean Squared Error (MSE) loss is used to minimize the difference between the student’s and teacher’s attention maps.
   - This ensures the student focuses on the same regions of the image (e.g., the lesion) as the teacher, improving its feature extraction capabilities.

#### Loss Function
The total loss for MAG-KD is a weighted combination of the three components:
Total Loss = alpha * Classification Loss + beta * KD Loss + gamma * Attention Loss
- Initial weights: `alpha=0.4`, `beta=0.3`, `gamma=0.3`.
- These weights were later tuned during hyperparameter optimization to find the optimal balance.

#### Implementation in the Project
- **Teacher Model**: EfficientNet-B4, which outputs logits and segmentation-like attention maps.
- **Student Model**: MobileNetV3-Large with an added attention mechanism (a sequence of convolutional layers to produce attention maps).
- **Training Process**:
  - The teacher model was frozen (in evaluation mode) to provide logits and attention maps.
  - The student model was trained to minimize the MAG-KD loss, learning from both the ground truth labels and the teacher’s knowledge.
  - The student’s attention maps were aligned with the teacher’s downsampled attention maps using MSE loss.
- **Initial Distilled Performance (Threshold 0.5)**:
  - Accuracy: 74.65%
  - Sensitivity: 94.39%
  - Specificity: 69.85%
  - Precision for Malignant: 0.32
  - F1-Score for Malignant: 0.48
  - ROC-AUC: 0.9088
- **Observation**: MAG-KD significantly improved the student model’s performance over its initial state, particularly in sensitivity (from 55% to 94.39%), making it comparable to the teacher model while being much lighter.

### Step 5: Hyperparameter Tuning
- **Tuned Parameters**:
  - Learning rate: `[0.0001, 0.0005, 0.001]`
  - MAG-KD loss weights (`alpha`, `beta`, `gamma`): `[(0.5, 0.3, 0.2), (0.3, 0.4, 0.3)]`
  - Batch size: `[4, 8, 16]`
  - Class weights: `[[1.0, 4.0], [1.0, 3.0]]`
- **Method**: Grid search with validation on a separate set, optimizing for a weighted score (prioritizing sensitivity, then accuracy and specificity).
- **Final Performance (Threshold 0.5)**:
  - Accuracy: 86.13%
  - Sensitivity: 88.27%
  - Specificity: 85.61%
  - Precision for Malignant: 0.60
  - F1-Score for Malignant: 0.71
  - ROC-AUC: 0.9539
- **Observation**: Tuning the MAG-KD weights (e.g., increasing `beta` to focus more on distillation) improved specificity (from 69.85% to 85.61%) and precision (from 0.32 to 0.60), while slightly reducing sensitivity (from 94.39% to 88.27%).

### Step 6: Model Optimization and Deployment
- **Model Conversion**:
  - Converted the Distilled Student Model to ONNX format (`student_model.onnx`).
  - Simplified the model using `onnx-simplifier` (`student_model_simplified.onnx`).
  - Applied dynamic quantization (`student_model_quantized.onnx`), reducing the model size to ~10-20 MB.
- **Testing**:
  - Tested the quantized model with ONNX Runtime, showing a small difference in output (e.g., 0.00028341822) compared to the PyTorch model, which is acceptable for mobile deployment.
- **Mobile Deployment**:
  - Integrated the model into a React/Capacitor app using TensorFlow.js with the ONNX backend.
  - Created a `SkinLesionDetector` component to capture images, preprocess them, run inference, and display results.
  - Deployed the app on Android using Capacitor.

## Model Performance

### Initial Student Model (Before Distillation)
- **Accuracy**: 62.38%
- **Sensitivity**: 55%
- **Specificity**: 64%
- **Precision (Malignant)**: 0.27
- **F1-Score (Malignant)**: 0.36
- **Observation**: Poor performance, not suitable for deployment.

### Teacher Model (Threshold 0.5)
- **Accuracy**: 80.14%
- **Sensitivity**: 94.39%
- **Specificity**: 76.67%
- **Precision (Malignant)**: 0.50
- **F1-Score (Malignant)**: 0.65
- **ROC-AUC**: 0.9519
- **Observation**: High sensitivity, but lower specificity and not optimized for mobile deployment.

### Distilled Student Model (After Hyperparameter Tuning, Threshold 0.5)
- **Accuracy**: 86.13%
- **Sensitivity**: 88.27%
- **Specificity**: 85.61%
- **Precision (Malignant)**: 0.60
- **F1-Score (Malignant)**: 0.71
- **ROC-AUC**: 0.9539
- **Observation**: Outperforms the Teacher Model in most metrics, with a good balance between sensitivity and specificity. Suitable for mobile deployment.


## Technical Stack UI

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



