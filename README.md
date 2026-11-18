# Dermo-Helper

Dermo-Helper is a cross-platform skin cancer preliminary screening application for skin lesion detection, aimed at classifying skin lesions as benign or malignant using deep learning. It performs real-time, client-side machine learning inference directly on the user's device using ONNX Runtime Web (onnxruntime-web) via WebAssembly (WASM). The application is designed to assist users in early detection of skin cancer by leveraging a lightweight, efficient model suitable for mobile deployment. The project involves training a teacher model, distilling its knowledge to a student model using Multi-Attention Guided Knowledge Distillation (MAG-KD), and deploying quantized ONNX model on web(using a React/Capacitor tech stack with WebAssembly inference) and mobile device using a web-based tech stack with Capacitor for cross-platform support.

https://github.com/user-attachments/assets/a98eb130-4e2d-4199-8235-b6e3cace18e6

### Web Version

The web version of DermoHelper is available at:
[https://dermo-helper-app.vercel.app](https://dermo-helper-app.vercel.app)

### Mobile App

The Android app can be downloaded from:
[Here](https://github.com/TenzinNsut/dermo-helper-app/releases/tag/DermoHelperAPK)

## Usage

1. Launch the app
2. Capture an image or select from the gallery
3. The app will analyze the image and provide a classification:
   - Low Risk (Benign)
   - Medium Risk (Potentially Malignant)
   - High Risk (Likely Malignant)
4. Review the analysis and confidence score
5. Share or save the results

### Key Achievements

- **Zero-Leakage Data Pipeline**: Implemented `StratifiedGroupKFold` by `lesion_id` to ensure absolute zero patient overlap across Train, Validation, and Test sets.
- **Balanced Teacher Training**: Fixed "Double Penalty" overfitting in the EfficientNet-B4 backbone using a two-phase freeze/unfreeze strategy and balanced Focal Loss (`gamma=2.0`, `weights=[1.0, 2.0]`).
- **MAG-KD Distillation**: Distilled knowledge to a MobileNetV3-Large Student model, extracting softened logits (KL-Divergence) and 7x7 spatial attention maps (MSE) from the Teacher.
- **Clinical Threshold Calibration**: Automatically swept and calibrated the decision threshold on the validation set to optimize a custom clinical score, establishing **0.46** as the optimal boundary.
- **Edge Optimization**: Exported via TorchScript (`dynamo=False`) and applied dynamic `QUInt8` quantization (MatMul/Gemm). Shrunk the model from 107.2 MB to 12.5 MB with zero loss in predictive accuracy for WebAssembly deployment.

## Important Note

DermoHelper is designed as a supplementary tool to assist healthcare professionals and should not be used as a replacement for professional medical diagnosis. Always consult with a qualified healthcare provider for proper diagnosis and treatment of skin conditions.

## Methodology

### Step 1: Data Preparation

- **Dataset**: Used the HAM10000 dataset, strictly grouped by `lesion_id` to prevent data leakage (Train: 10,771 | Val: 963 | Test: 1,045).
- **Class Balance**: Handled the 80/20 class imbalance by oversampling ONLY the training set to a 60:40 (Benign:Malignant) ratio.
- **Preprocessing**: Resized to 224x224, converted to CHW format, and normalized with ImageNet mean (`[0.485, 0.456, 0.406]`) and std (`[0.229, 0.224, 0.225]`).

### Step 2: Teacher Model Training

- **Model**: EfficientNet-B4 with dual outputs (binary classification logits and a 28x28 segmentation map).
- **Training Strategy**:
  - Phase 1: Backbone frozen, trained new classification and segmentation heads (Warmup).
  - Phase 2: Unfrozen for full-network fine-tuning.
- **Loss**: Focal Loss (`gamma=2.0`, `weights=[1.0, 2.0]`) to handle class imbalance without over-penalizing benign cases.

### Step 3: Knowledge Distillation with MAG-KD

**MAG-KD (Multi-Attention Guided Knowledge Distillation)** transfers knowledge from a larger, high-performing teacher model to a smaller, efficient student model (MobileNetV3-Large). It incorporates multiple levels of guidance:

1. **Classification Loss (`alpha=0.35`)**: Focal Loss (`gamma=2.0`) on the ground truth labels.
2. **Knowledge Distillation Loss (`beta=0.45`)**: KL-Divergence matching the student’s softened logits (`T=4.0`) to the teacher’s softened logits.
3. **Attention Alignment Loss (`gamma=0.20`)**: MSE loss aligning the student’s 7x7 attention maps with the teacher’s downsampled 28x28 segmentation maps, forcing the student to physically "look" at the lesion.

### Step 4: Edge Optimization & ONNX Deployment

- **Conversion**: Wrapped the Student model to strip the training attention head, exported to ONNX (Opset 13), and applied dynamic `QUInt8` quantization.
- **Deployment**: Integrated into a React/Capacitor app using `onnxruntime-web` (WASM execution provider) and zero-dependency HTML5 Canvas preprocessing. The 8-bit quantization achieved a nearly 9x size reduction while retaining 100% of the PyTorch Student model's metrics.

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

- Total Loss = alpha _ Classification Loss + beta _ KD Loss + gamma \* Attention Loss
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
  - Accuracy: 88.02%
  - Sensitivity: 84.69%
  - Specificity: 88.83%
  - Precision for Malignant: 0.65
  - F1-Score for Malignant: 0.73
  - ROC-AUC: 0.9509
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

## Model Performance (Unseen Test Set)

All models were evaluated using the mathematically calibrated optimal decision threshold of **0.46**.

### 1. Teacher Model (EfficientNet-B4)

- **Accuracy**: 82.0%
- **Sensitivity**: 89.6%
- **Specificity**: 80.2%
- **F1-Score**: 0.6582
- **ROC-AUC**: 0.9208
- **Size**: 107.2 MB

### 2. Distilled Student Model (PyTorch)

- **Accuracy**: 85.7%
- **Sensitivity**: 86.6%
- **Specificity**: 85.5%
- **F1-Score**: 0.7014
- **ROC-AUC**: 0.9344
- **Size**: 20.5 MB

### 3. Deployed Edge Model (Quantized ONNX)

- **Accuracy**: 85.7%
- **Sensitivity**: 86.6%
- **Specificity**: 85.5%
- **F1-Score**: 0.7014
- **ROC-AUC**: 0.9345
- **Size**: 12.5 MB

_Observation: The distilled Student model outperformed the heavier Teacher model in overall Accuracy, Specificity, and AUC by learning a smoother, more generalized decision boundary from the softened distillation targets._

<img width="1751" height="457" alt="image" src="https://github.com/user-attachments/assets/d08e47b7-f668-4d11-be73-24d8f14cb4fe" />
<img width="1718" height="495" alt="image" src="https://github.com/user-attachments/assets/054cb2a4-f350-4fe2-a7c0-153026799621" />

## Project Directory Structure

```
dermo-helper-app/
├── public/
│   └── models/
│       └── student_model_quantized.onnx    # 8-bit quantized ONNX model
├── src/
│   ├── components/
│   │   ├── ActionButton.tsx               # Primary/secondary UI action buttons
│   │   ├── Header.tsx                     # Sticky app bar with offline status badge
│   │   ├── ImagePreview.tsx               # Responsive lesion preview container
│   │   ├── Layout.tsx                     # Root page layout wrapper
│   │   ├── OfflineReadyBadge.tsx          # "ONNX WASM Ready · 100% Offline" pill
│   │   ├── SkinLesionDetector.tsx         # Standalone test detector component
│   │   └── ui/                            # Lean UI components (Button, Card, Sonner, Toast)
│   ├── hooks/
│   │   ├── use-toast.ts                   # Toast notification hook
│   │   ├── useCapacitorCamera.tsx         # Native hardware camera bridge
│   │   └── useModelReady.ts               # Reactive ONNX WASM readiness listener
│   ├── pages/
│   │   ├── Index.tsx                      # Home screen (Hero, Photo, Gallery)
│   │   ├── Camera.tsx                     # Real-time photo capture screen
│   │   └── Results.tsx                    # Detailed diagnostic evaluation & report
│   ├── services/
│   │   └── modelService.ts                # Singleton ONNX inference & canvas preprocessor
│   ├── App.tsx                            # Route definitions
│   ├── index.css                          # Tailwind CSS custom styles & animations
│   └── main.tsx                           # Application entry point
├── android/                               # Native Android project (Capacitor)
├── capacitor.config.json                  # Capacitor native runtime configuration
├── package.json                           # Cleaned, optimized dependency manifest
├── tailwind.config.ts                     # Tailwind theme and custom keyframes
└── vite.config.ts                         # Vite build and asset pipeline configuration
```

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
