import React, { useState, useEffect } from "react";
import { Camera, CameraResultType } from "@capacitor/camera";
import * as ort from "onnxruntime-web";
import { preprocessImageCanvas } from "@/services/modelService";
import { Button } from "@/components/ui/button"; // shadcn-ui Button
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // shadcn-ui Card
import { toast } from "sonner"; // Toast notifications
import { Loader2, Camera as CameraIcon, Upload, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, Clock } from "lucide-react"; // Icons

const SkinLesionDetector: React.FC = () => {
  const [session, setSession] = useState<ort.InferenceSession | null>(null);
  const [modelStatus, setModelStatus] = useState<string>("Loading student_model_quantized.onnx...");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [malignantProb, setMalignantProb] = useState<number | null>(null);
  const [benignProb, setBenignProb] = useState<number | null>(null);
  const [riskTier, setRiskTier] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [inferenceTimeMs, setInferenceTimeMs] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load the ONNX model (public/models/student_model_quantized.onnx) when component mounts
  useEffect(() => {
    const loadModel = async () => {
      try {
        const candidatePaths = [
          "/models/student_model_quantized.onnx",
          "models/student_model_quantized.onnx",
          "public/models/student_model_quantized.onnx",
        ];

        let loadedSession: ort.InferenceSession | null = null;
        let loadedPath = "";

        for (const path of candidatePaths) {
          try {
            console.log(`[SkinLesionDetector] Loading ONNX model from: ${path}`);
            loadedSession = await ort.InferenceSession.create(path, {
              executionProviders: ["wasm"],
            });
            if (loadedSession) {
              loadedPath = path;
              break;
            }
          } catch (e) {
            console.warn(`[SkinLesionDetector] Failed to load from ${path}:`, e);
          }
        }

        if (loadedSession) {
          console.log(`[SkinLesionDetector] student_model_quantized.onnx loaded successfully from: ${loadedPath}`);
          console.log(`[SkinLesionDetector] Model inputs:`, loadedSession.inputNames);
          console.log(`[SkinLesionDetector] Model outputs:`, loadedSession.outputNames);
          setSession(loadedSession);
          setModelStatus("student_model_quantized.onnx (Active)");
          toast.success("Model student_model_quantized.onnx loaded");
        } else {
          throw new Error("Could not load student_model_quantized.onnx from any path");
        }
      } catch (error) {
        console.error("[SkinLesionDetector] Error loading model:", error);
        setModelStatus("Failed to load student_model_quantized.onnx");
        toast.error("Failed to load student_model_quantized.onnx");
      }
    };

    loadModel();
  }, []);

  // Function to capture an image using the device camera
  const captureImage = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
      });

      setImageSrc(image.dataUrl || null);
      setPrediction(null);
      setProbability(null);
      setRiskTier(null);
    } catch (error) {
      console.error("Error capturing image:", error);
      toast.error("Camera unavailable. You can upload a photo instead.");
    }
  };

  // Function to upload an image from file input (for desktop / gallery fallback)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") {
          setImageSrc(event.target.result);
          setPrediction(null);
          setProbability(null);
          setRiskTier(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to run inference using student_model_quantized.onnx
  const runInference = async () => {
    if (!session || !imageSrc) {
      toast.error("Model or image not loaded");
      return;
    }

    setLoading(true);
    const startTime = performance.now();
    try {
      console.log("[SkinLesionDetector] Running evaluation with student_model_quantized.onnx...");

      // Load the image into an HTMLImageElement for preprocessing
      const imgElement = new Image();
      imgElement.src = imageSrc;
      await new Promise((resolve, reject) => {
        imgElement.onload = () => resolve(true);
        imgElement.onerror = () => reject(new Error("Failed to load image for preprocessing"));
      });

      // 1. Preprocess using HTML5 <canvas> (Center-crop, 224x224, ImageNet normalized, CHW Float32Array)
      const preprocessedData = preprocessImageCanvas(imgElement);

      // 2. Create ONNX tensor [1, 3, 224, 224]
      const onnxTensor = new ort.Tensor("float32", preprocessedData, [1, 3, 224, 224]);

      // Run inference through student_model_quantized.onnx
      const inputName = session.inputNames[0] || "input";
      const outputName = session.outputNames[0] || "output";
      const results = await session.run({ [inputName]: onnxTensor });
      const outputData = results[outputName].data as Float32Array;

      console.log("[SkinLesionDetector] Model raw output logits [Benign, Malignant]:", Array.from(outputData));

      // Numerically stable Softmax over [Benign_Logit, Malignant_Logit]
      const maxLogit = Math.max(outputData[0], outputData[1]);
      const exp0 = Math.exp(outputData[0] - maxLogit);
      const exp1 = Math.exp(outputData[1] - maxLogit);
      const sum = exp0 + exp1;
      const bProb = exp0 / sum;
      const mProb = exp1 / sum;

      // Calibrated optimal threshold: 0.46
      const threshold = 0.46;
      const label = mProb >= threshold ? 'Malignant' : 'Benign';
      
      let tier = 'Low Risk (Benign)';
      let rLevel: 'low' | 'medium' | 'high' = 'low';
      if (mProb >= 0.75) {
        tier = 'High Risk (Likely Malignant)';
        rLevel = 'high';
      } else if (mProb >= threshold) {
        tier = 'Medium Risk (Potentially Malignant)';
        rLevel = 'medium';
      } else {
        tier = 'Low Risk (Benign)';
        rLevel = 'low';
      }

      const elapsed = Math.round(performance.now() - startTime);

      console.log(`[SkinLesionDetector] Result: Label=${label}, Malignant=${(mProb * 100).toFixed(1)}%, Benign=${(bProb * 100).toFixed(1)}%, Tier=${tier}`);

      setPrediction(label);
      setMalignantProb(mProb);
      setBenignProb(bProb);
      setRiskTier(tier);
      setRiskLevel(rLevel);
      setInferenceTimeMs(elapsed);
      toast.success("Prediction completed");
    } catch (error) {
      console.error("[SkinLesionDetector] Error running inference with student_model_quantized.onnx:", error);
      toast.error("Failed to run prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Skin Lesion Detector</CardTitle>
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          {session ? (
            <span className="inline-flex items-center text-emerald-600 gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {modelStatus}
            </span>
          ) : (
            <span className="inline-flex items-center text-amber-600 gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {modelStatus}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="flex gap-2">
          <Button onClick={captureImage} className="flex items-center space-x-2">
            <CameraIcon className="w-5 h-5" />
            <span>Capture Image</span>
          </Button>

          <label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="outline" asChild className="cursor-pointer flex items-center space-x-2">
              <span>
                <Upload className="w-4 h-4 mr-1" />
                Upload Photo
              </span>
            </Button>
          </label>
        </div>

        {imageSrc && (
          <div className="mt-2 w-full flex justify-center">
            <img
              src={imageSrc}
              alt="Captured"
              className="w-48 h-48 object-cover rounded-xl border shadow-sm"
            />
          </div>
        )}

        {imageSrc && (
          <Button onClick={runInference} disabled={loading || !session} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Evaluating with student_model_quantized.onnx...
              </>
            ) : (
              "Run Prediction"
            )}
          </Button>
        )}

        {prediction && malignantProb !== null && benignProb !== null && (
          <div className="w-full space-y-4 mt-4 animate-scale-in">
            {/* TOP CARD: Detailed Risk Stratification (Clean Whitish Style) */}
            <div
              className={`bg-white border rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-sm ${
                riskLevel === "low"
                  ? "border-emerald-200/80 bg-emerald-50/20"
                  : riskLevel === "medium"
                    ? "border-amber-200/80 bg-amber-50/20"
                    : "border-red-200/80 bg-red-50/20"
              }`}
            >
              <div className="flex items-center gap-3 md:gap-4">
                {/* Status Icon container */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                    riskLevel === "low"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : riskLevel === "medium"
                        ? "bg-amber-50 border-amber-200 text-amber-600"
                        : "bg-red-50 border-red-200 text-red-600"
                  }`}
                >
                  {riskLevel === "low" ? (
                    <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                  ) : riskLevel === "medium" ? (
                    <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
                  )}
                </div>

                <div>
                  {/* Status Pill Badge */}
                  <div
                    className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase border ${
                      riskLevel === "low"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : riskLevel === "medium"
                          ? "bg-amber-50 border-amber-300 text-amber-700"
                          : "bg-red-50 border-red-300 text-red-700"
                    }`}
                  >
                    {riskLevel === "low"
                      ? "LOW RISK (BENIGN)"
                      : riskLevel === "medium"
                        ? "MEDIUM RISK (POTENTIALLY MALIGNANT)"
                        : "HIGH RISK (LIKELY MALIGNANT)"}
                  </div>

                  {/* Primary Confidence Text */}
                  <p className="text-sm text-slate-600 mt-1 font-normal">
                    Confidence:{" "}
                    <span className="font-bold text-slate-900">
                      {(
                        (prediction === "Benign" ? benignProb : malignantProb) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </p>
                </div>
              </div>

              {/* Right Column: Class Probabilities Breakdown */}
              <div className="border-l border-slate-200 pl-3 md:pl-5 text-xs md:text-sm flex flex-col justify-center space-y-1">
                <div className="flex items-center justify-between gap-2.5">
                  <span className="text-slate-500 font-medium">Benign:</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {(benignProb * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2.5">
                  <span className="text-slate-500 font-medium">Malignant:</span>
                  <span className="font-bold text-red-600 font-mono">
                    {(malignantProb * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* BOTTOM CARD: Malignancy Probability Bar with Cutoff Dividers (Clean Whitish Style) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 md:p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xs md:text-sm font-semibold tracking-wider text-slate-700 uppercase">
                    MALIGNANCY PROBABILITY
                  </h4>
                  <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
                    Calibrated against clinical threshold (0.46)
                  </p>
                </div>

                {/* Giant Malignancy Percentage */}
                <span
                  className={`text-2xl md:text-3xl font-extrabold tracking-tight font-mono ${
                    riskLevel === "low"
                      ? "text-emerald-600"
                      : riskLevel === "medium"
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {(malignantProb * 100).toFixed(1)}%
                </span>
              </div>

              {/* Multi-tier Progress Bar */}
              <div className="relative w-full h-3.5 bg-slate-100 border border-slate-200/70 rounded-full overflow-hidden mt-3">
                {/* Active Progress Fill */}
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    riskLevel === "low"
                      ? "bg-emerald-500"
                      : riskLevel === "medium"
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(Math.max(malignantProb * 100, 0), 100)}%`,
                  }}
                />
                {/* 46% Cutoff Tick Mark Divider (Amber) */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-amber-500 z-10 pointer-events-none"
                  style={{ left: "46%" }}
                />
                {/* 75% High Risk Tick Mark Divider (Red) */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none"
                  style={{ left: "75%" }}
                />
              </div>

              {/* Axis Labels & Cutoff Markers */}
              <div className="relative w-full text-[10px] md:text-xs font-mono font-medium mt-2 h-4">
                <span className="text-emerald-600 font-semibold absolute left-0">
                  0% (Benign)
                </span>
                <span className="text-amber-600 font-semibold absolute left-[46%] -translate-x-1/2 flex items-center gap-0.5 whitespace-nowrap">
                  ▲ 46% Cutoff
                </span>
                <span className="text-red-600 font-semibold absolute left-[75%] -translate-x-1/2 flex items-center gap-0.5 whitespace-nowrap">
                  ▲ 75% High Risk
                </span>
                <span className="text-red-600 font-semibold absolute right-0">100%</span>
              </div>
            </div>

            {/* Inference Time Footer */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>
                Inference completed in {inferenceTimeMs || 100} ms
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkinLesionDetector;
