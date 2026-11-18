import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Upload,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Cpu,
  Layers,
  Scale,
  Lock,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  FileText,
  Github,
} from "lucide-react";
import Layout from "@/components/Layout";
import ActionButton from "@/components/ActionButton";
import OfflineReadyBadge from "@/components/OfflineReadyBadge";

const ANDROID_RELEASE_URL =
  "https://github.com/TenzinNsut/dermo-helper-app/releases/tag/DermoHelperAPK";

const Index = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPEG, PNG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        navigate("/results", {
          state: { imageData: event.target.result },
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  return (
    <Layout className="space-y-16 sm:space-y-20 max-w-4xl mx-auto">
      {/* =========================================================================
          1. SCREENING STUDIO (HERO) - BRUTALIST
      ========================================================================== */}
      <section id="screening" className="pt-2 sm:pt-4 text-center">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <OfflineReadyBadge variant="full" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-black bg-white text-black text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#000]">
            <Cpu className="w-3.5 h-3.5" />
            <span>MobileNetV3 // INT8 ONNX (12.5 MB)</span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black leading-tight mb-3">
          SKIN LESION SCREENING
        </h1>

        <p className="text-sm sm:text-base text-slate-800 max-w-xl mx-auto font-medium leading-relaxed mb-6">
          Take or upload a photo of concerning skin areas for instant on-device
          preliminary classification for malignant vs. benign skin lesions.
        </p>

        {/* Screening Card - Brutalist */}
        <div className="bg-white border-2 border-black rounded-none sm:rounded-md p-6 sm:p-7 shadow-[6px_6px_0px_#000] max-w-xl mx-auto text-left">
          {/* Card Top Label Strip */}
          <div className="border-b-2 border-black pb-3 mb-5 flex justify-between items-center font-mono text-xs font-bold uppercase">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-black inline-block" />
              <span>DIAGNOSTIC WORKSTATION</span>
            </span>
            <span className="bg-yellow-300 text-black px-2 py-0.5 border border-black">
              WASM LOCAL ENGINE
            </span>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-black p-6 sm:p-8 cursor-pointer transition-none flex flex-col items-center justify-center text-center mb-5 ${
              isDragging
                ? "bg-yellow-200"
                : "bg-slate-50 hover:bg-yellow-100/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileProcess(file);
              }}
            />
            <div className="w-12 h-12 bg-black text-white border-2 border-black flex items-center justify-center mb-2.5 shadow-[2px_2px_0px_#000]">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-black uppercase tracking-tight mb-0.5">
              Click or drag lesion photo here
            </p>
            <p className="text-xs font-mono font-medium text-slate-600">
              JPG, PNG, WEBP · Normalized to 224×224 CHW on Canvas
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ActionButton
              icon={<Camera className="w-4 h-4" />}
              size="lg"
              className="w-full justify-center uppercase font-mono tracking-wider"
              onClick={() => navigate("/camera")}
            >
              Take Photo
            </ActionButton>

            <ActionButton
              icon={<Upload className="w-4 h-4" />}
              variant="secondary"
              size="lg"
              className="w-full justify-center uppercase font-mono tracking-wider"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Image
            </ActionButton>
          </div>

          {/* Technical Specs Footer */}
          <div className="mt-4 pt-3 border-t-2 border-black flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] font-bold text-slate-700 uppercase">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-black" />
              <span>100% On-Device</span>
            </span>
            <span>Threshold: 0.46</span>
            <span>Latency: ~80ms</span>
          </div>
        </div>

        {/* Android Download Strip - Brutalist */}
        <div className="mt-5 max-w-xl mx-auto p-3.5 bg-emerald-300 border-2 border-black shadow-[3px_3px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-black text-white flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-black uppercase">
              Prefer a mobile app? Download DermoHelper Android APK.
            </span>
          </div>
          <a
            href={ANDROID_RELEASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-slate-800 text-xs font-mono font-bold uppercase border-2 border-black shadow-[2px_2px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex-shrink-0"
          >
            <span>GET APK</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>

      {/* =========================================================================
          2. MOTIVATION - BRUTALIST
      ========================================================================== */}
      <section
        id="motivation"
        className="space-y-4 pt-4 border-t-2 border-black"
      >
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-black text-white font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
              01 // MOTIVATION
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-black tracking-tight">
              Clinical Objectives
            </h2>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-800 leading-relaxed font-medium">
          <p>
            The primary goal of this project is to develop a reliable and
            efficient system for classifying skin lesions into benign and
            malignant categories, emphasizing <strong>high sensitivity</strong>{" "}
            so malignant cases are not missed.
          </p>

          <p>
            Standard high-capacity neural networks (such as EfficientNet-B4)
            achieve strong classification accuracy but require substantial
            compute and over 100 MB of storage, preventing smooth execution on
            mobile devices, offline rural clinics, or resource-constrained
            hardware.
          </p>

          <p>
            To resolve this trade-off, we employ a{" "}
            <strong>Teacher-Student Knowledge Distillation</strong> framework. A
            high-capacity teacher model (EfficientNet-B4) mentors a compact
            student model (MobileNetV3-Large). Distillation transfers both
            softened class distributions and spatial attention maps, allowing
            the student to retain the diagnostic capability of the teacher while
            operating at a fraction of the computational footprint.
          </p>
        </div>

        {/* 3 Core Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          <div className="bg-emerald-100 border-2 border-black shadow-[3px_3px_0px_#000] p-4 space-y-1">
            <div className="text-xs font-mono font-bold uppercase text-black flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              <span>Sensitivity Priority</span>
            </div>
            <p className="text-xs text-slate-800 font-medium">
              Minimizing false negatives to ensure malignant lesions are flagged
              for prompt clinical biopsy.
            </p>
          </div>

          <div className="bg-yellow-200 border-2 border-black shadow-[3px_3px_0px_#000] p-4 space-y-1">
            <div className="text-xs font-mono font-bold uppercase text-black flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>Edge Efficiency</span>
            </div>
            <p className="text-xs text-slate-800 font-medium">
              8.6× model compression to execute on client-side WebAssembly
              without requiring cloud GPU servers.
            </p>
          </div>

          <div className="bg-cyan-200 border-2 border-black shadow-[3px_3px_0px_#000] p-4 space-y-1">
            <div className="text-xs font-mono font-bold uppercase text-black flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>Patient Privacy</span>
            </div>
            <p className="text-xs text-slate-800 font-medium">
              Evaluated 100% locally on the device hardware. Images never leave
              the client device.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. METHODOLOGY - BRUTALIST
      ========================================================================== */}
      <section
        id="methodology"
        className="space-y-6 pt-4 border-t-2 border-black"
      >
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-black text-white font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
              02 // METHODOLOGY
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-black tracking-tight">
              Distillation & Training Pipeline
            </h2>
          </div>
        </div>

        {/* Step 1: Data Preparation */}
        <div className="space-y-3">
          <h3 className="text-base font-bold uppercase text-black flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-mono">
              STEP 1
            </span>
            <span>Zero-Leakage Data Preparation & Balancing</span>
          </h3>
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            Trained on the HAM10000 dataset, strictly grouped by patient{" "}
            <code className="bg-black text-white px-1.5 py-0.5 font-mono text-xs">
              lesion_id
            </code>{" "}
            using{" "}
            <code className="bg-black text-white px-1.5 py-0.5 font-mono text-xs">
              StratifiedGroupKFold
            </code>{" "}
            (Train: 10,771 | Val: 963 | Test: 1,045). This guarantees that
            multiple images of the same lesion never cross train, validation, or
            test sets. The severe 80/20 class imbalance was resolved by
            oversampling only the training set to a 60:40 (Benign:Malignant)
            ratio.
          </p>

          {/* Figure 1 Frame */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-3 text-center">
            <img
              src="/images/data-preparation.jpg"
              alt="Training Set Class Balance and Sample Lesion Ground-Truth Mask"
              className="max-h-64 w-auto mx-auto object-contain border border-black"
            />
            <div className="font-mono text-xs font-bold uppercase text-black border-t-2 border-black pt-2 mt-2">
              Figure 1 // Training set class balance before/after oversampling,
              sample benign lesion, and ground-truth segmentation mask.
            </div>
          </div>
        </div>

        {/* Step 2: Teacher Model */}
        <div className="space-y-2 pt-2">
          <h3 className="text-base font-bold uppercase text-black flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-mono">
              STEP 2
            </span>
            <span>Teacher Model Training (EfficientNet-B4)</span>
          </h3>
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            The teacher model is an EfficientNet-B4 network with dual outputs:
            binary classification logits and a 28×28 spatial segmentation
            attention map. It was trained using balanced Focal Loss (
            <code className="font-mono text-xs font-bold">γ=2.0</code>, class
            weights{" "}
            <code className="font-mono text-xs font-bold">[1.0, 2.0]</code>) in
            two phases: frozen backbone warmup followed by full-network
            fine-tuning.
          </p>
        </div>

        {/* Step 3: MAG-KD Distillation */}
        <div className="space-y-3 pt-2">
          <h3 className="text-base font-bold uppercase text-black flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-mono">
              STEP 3
            </span>
            <span>Multi-Attention Guided Knowledge Distillation (MAG-KD)</span>
          </h3>
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            MAG-KD transfers knowledge from the EfficientNet-B4 teacher to the
            MobileNetV3-Large student. Unlike standard distillation that only
            matches output probabilities, MAG-KD applies a tri-partite loss that
            compels the student to replicate the teacher's spatial attention on
            the lesion:
          </p>

          {/* Loss Equation Box - Brutalist */}
          <div className="bg-black text-yellow-300 border-2 border-black p-3.5 text-center font-mono text-xs sm:text-sm font-bold shadow-[3px_3px_0px_#000]">
            TOTAL_LOSS = 0.35 · L_FOCAL + 0.45 · L_KD + 0.20 · L_ATTENTION
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-medium text-xs text-slate-800">
            <div className="border-2 border-black p-3 bg-white">
              <span className="font-mono font-bold block mb-1 uppercase text-black">
                // L_FOCAL (α=0.35)
              </span>
              Focal Loss on ground truth with class weights [1.0, 4.0] to
              prioritize minority malignant cases.
            </div>
            <div className="border-2 border-black p-3 bg-white">
              <span className="font-mono font-bold block mb-1 uppercase text-black">
                // L_KD (β=0.45)
              </span>
              KL-Divergence matching student softened logits to teacher softened
              logits at temperature T=4.0.
            </div>
            <div className="border-2 border-black p-3 bg-white">
              <span className="font-mono font-bold block mb-1 uppercase text-black">
                // L_ATTENTION (γ=0.20)
              </span>
              MSE loss aligning student 7×7 attention maps with teacher
              downsampled 28×28 segmentation masks.
            </div>
          </div>

          {/* Figure 2 Frame */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-3 text-center">
            <img
              src="/images/attention-transfer.jpg"
              alt="MAG-KD Spatial Attention Transfer Verification"
              className="max-h-64 w-auto mx-auto object-contain border border-black"
            />
            <div className="font-mono text-xs font-bold uppercase text-black border-t-2 border-black pt-2 mt-2">
              Figure 2 // MAG-KD spatial attention transfer verification: Input
              image, true mask (224×224), teacher predicted mask (28×28), and
              student distilled 7×7 attention focusing on the lesion.
            </div>
          </div>
        </div>

        {/* Step 4: Edge Optimization */}
        <div className="space-y-2 pt-2">
          <h3 className="text-base font-bold uppercase text-black flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-mono">
              STEP 4
            </span>
            <span>Edge Optimization & 8-bit Quantization</span>
          </h3>
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            The training attention head is stripped to yield a clean{" "}
            <code className="font-mono font-bold">[1, 2]</code> output tensor.
            The student was exported to ONNX (Opset 13) and dynamically
            quantized to 8-bit integers (
            <code className="font-mono font-bold">QUInt8</code>), reducing model
            size from 107.2 MB to 12.5 MB. A zero-dependency HTML5 Canvas
            preprocessor (1:1 center-crop, 224×224 resize, ImageNet
            normalization, CHW transposition) handles incoming images.
          </p>
        </div>
      </section>

      {/* =========================================================================
          4. RESULTS & CONCLUSION - BRUTALIST
      ========================================================================== */}
      <section
        id="conclusion"
        className="space-y-5 pt-4 border-t-2 border-black"
      >
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-black text-white font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
              03 // RESULTS & CONCLUSION
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-black tracking-tight">
              Test Set Evaluation & Findings
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-800 font-medium leading-relaxed">
          All models were evaluated on the held-out test set of 1,045 patient
          images using the calibrated optimal clinical decision threshold of{" "}
          <strong>0.46</strong>.
        </p>

        {/* Figure 3 Frame */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-3 text-center">
          <img
            src="/images/metrics-comparison.png"
            alt="Classification Metrics Comparison and Model File Size Comparison"
            className="max-h-72 w-auto mx-auto object-contain border border-black"
          />
          <div className="font-mono text-xs font-bold uppercase text-black border-t-2 border-black pt-2 mt-2">
            Figure 3 // Unseen test set benchmark metrics (Accuracy,
            Sensitivity, Specificity, F1-Score, ROC-AUC) alongside file size
            reduction from Teacher (107.2 MB) to Quantized ONNX (12.5 MB).
          </div>
        </div>

        {/* Benchmark Table - Brutalist */}
        <div className="border-2 border-black shadow-[4px_4px_0px_#000] bg-white overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-black text-white font-mono font-bold uppercase">
              <tr>
                <th className="py-2.5 px-3 sm:px-4 border-r border-slate-700">
                  MODEL
                </th>
                <th className="py-2.5 px-3 sm:px-4 border-r border-slate-700">
                  ACCURACY
                </th>
                <th className="py-2.5 px-3 sm:px-4 border-r border-slate-700">
                  SENSITIVITY
                </th>
                <th className="py-2.5 px-3 sm:px-4 border-r border-slate-700">
                  SPECIFICITY
                </th>
                <th className="py-2.5 px-3 sm:px-4 border-r border-slate-700">
                  ROC-AUC
                </th>
                <th className="py-2.5 px-3 sm:px-4">SIZE</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black font-mono text-xs font-semibold">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 sm:px-4 font-sans font-bold text-black border-r-2 border-black">
                  Teacher (EfficientNet-B4)
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black">
                  82.0%
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black">
                  89.6%
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black">
                  80.2%
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black">
                  0.9208
                </td>
                <td className="py-2.5 px-3 sm:px-4 text-slate-600">107.2 MB</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 sm:px-4 font-sans font-bold text-black border-r-2 border-black">
                  Student (PyTorch MobileNetV3)
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black text-blue-700">
                  85.7%
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black">
                  86.6%
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black text-blue-700">
                  85.5%
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black text-blue-700">
                  0.9344
                </td>
                <td className="py-2.5 px-3 sm:px-4 text-slate-600">20.5 MB</td>
              </tr>
              <tr className="bg-emerald-200 text-black font-bold border-t-2 border-black">
                <td className="py-2.5 px-3 sm:px-4 font-sans text-black border-r-2 border-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 inline" />
                  <span>Student (Quantized ONNX)</span>
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black">
                  85.7%
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black">
                  86.6%
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black">
                  85.5%
                </td>
                <td className="py-2.5 px-3 sm:px-4 border-r-2 border-black">
                  0.9345
                </td>
                <td className="py-2.5 px-3 sm:px-4">12.5 MB</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Key Conclusions Callout - Brutalist */}
        <div className="bg-yellow-100 border-2 border-black shadow-[4px_4px_0px_#000] p-4 sm:p-5 space-y-2">
          <h4 className="font-mono font-bold text-black text-xs uppercase tracking-wider">
            // KEY FINDINGS & CONCLUSIONS
          </h4>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-900 font-medium list-disc pl-5">
            <li>
              <strong>Student Outperforms Teacher in Generalization</strong>:
              The distilled student achieved higher overall accuracy (85.7% vs
              82.0%), higher specificity (85.5% vs 80.2%), and higher ROC-AUC
              (0.9345 vs 0.9208). Softened teacher probability targets
              regularized the decision boundary and eliminated overfitting to
              benign skin variations.
            </li>
            <li>
              <strong>8.6× Compression with Zero Metric Degradation</strong>:
              8-bit dynamic quantization shrank the model from 107.2 MB to 12.5
              MB while maintaining identical accuracy (85.7%) and sensitivity
              (86.6%) compared to the 32-bit floating point PyTorch student.
            </li>
            <li>
              <strong>Calibrated Clinical Boundary (0.46)</strong>: Calibrating
              the decision threshold to 0.46 provides high sensitivity (86.6%)
              for early melanoma detection, avoiding the dangerous
              false-negative risks of uncalibrated 0.50 thresholds.
            </li>
          </ul>
        </div>
      </section>

      {/* =========================================================================
          5. DOWNLOAD THE ANDROID APP - BRUTALIST
      ========================================================================== */}
      <section id="download" className="pt-2">
        <div className="bg-emerald-300 border-2 border-black p-6 sm:p-8 shadow-[6px_6px_0px_#000] text-black flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black text-white font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#fff]">
              <Smartphone className="w-3.5 h-3.5" />
              <span>ANDROID APK RELEASE // V2.0</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-black tracking-tight">
              DOWNLOAD DERMO-HELPER FOR ANDROID
            </h2>
            <p className="text-xs sm:text-sm text-slate-900 max-w-lg font-medium leading-relaxed">
              Install the standalone APK on your Android device for
              zero-latency, 100% offline point-of-care screening with direct
              hardware camera sensor access.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto flex-shrink-0">
            <a
              href={ANDROID_RELEASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-black hover:bg-slate-800 text-white font-mono text-xs sm:text-sm font-bold uppercase border-2 border-black shadow-[3px_3px_0px_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>DOWNLOAD APK (v2.0)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://github.com/TenzinNsut/dermo-helper-app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-white hover:bg-slate-100 text-black font-mono text-xs sm:text-sm font-bold uppercase border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <Github className="w-4 h-4" />
              <span>GITHUB</span>
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. MEDICAL DISCLAIMER - BRUTALIST
      ========================================================================== */}
      <section className="pt-2">
        <div className="border-2 border-black p-4 sm:p-5 bg-red-100 shadow-[4px_4px_0px_#000] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1 text-xs text-black leading-relaxed font-medium">
            <strong className="font-mono font-bold uppercase block text-red-950">
              // IMPORTANT MEDICAL DISCLAIMER:
            </strong>
            <p>
              DermoHelper is an experimental screening decision-support aid
              designed for educational and preliminary assessment purposes. It
              does not provide formal medical diagnosis and does not replace
              histological biopsy or clinical consultation with a certified
              dermatologist. If you observe any skin lesion changing in color,
              border, symmetry, or size, consult a qualified healthcare provider
              immediately.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
