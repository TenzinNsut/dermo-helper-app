import React, { useState, useEffect } from "react";
import { Camera, CameraResultType } from "@capacitor/camera";
import * as ort from "onnxruntime-web";
import { preprocessImageCanvas } from "@/services/modelService";
import { toast } from "sonner";
import {
  Loader2,
  Camera as CameraIcon,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from "lucide-react";

const SkinLesionDetector: React.FC = () => {
  const [session, setSession] = useState<ort.InferenceSession | null>(null);
  const [modelStatus, setModelStatus] = useState<string>(
    "Loading student_model_quantized.onnx...",
  );
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [malignantProb, setMalignantProb] = useState<number | null>(null);
  const [benignProb, setBenignProb] = useState<number | null>(null);
  const [riskTier, setRiskTier] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | null>(
    null,
  );
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
          console.log(
            `[SkinLesionDetector] student_model_quantized.onnx loaded successfully from: ${loadedPath}`,
          );
          setSession(loadedSession);
          setModelStatus("student_model_quantized.onnx (Active)");
          toast.success("Model loaded in WebAssembly");
        } else {
          throw new Error(
            "Could not load student_model_quantized.onnx from any path",
          );
        }
      } catch (error) {
        console.error("[SkinLesionDetector] Error loading model:", error);
        setModelStatus("Failed to load student_model_quantized.onnx");
        toast.error("Failed to load student_model_quantized.onnx");
      }
    };

    loadModel();
  }, []);

  const captureImage = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
      });

      setImageSrc(image.dataUrl || null);
      setPrediction(null);
      setMalignantProb(null);
      setBenignProb(null);
      setRiskTier(null);
    } catch (error) {
      console.error("Error capturing image:", error);
      toast.error("Camera unavailable. You can upload a photo instead.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") {
          setImageSrc(event.target.result);
          setPrediction(null);
          setMalignantProb(null);
          setBenignProb(null);
          setRiskTier(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const runInference = async () => {
    if (!session || !imageSrc) {
      toast.error("Model or image not loaded");
      return;
    }

    setLoading(true);
    const startTime = performance.now();
    try {
      console.log(
        "[SkinLesionDetector] Running evaluation with student_model_quantized.onnx...",
      );

      const imgElement = new Image();
      imgElement.src = imageSrc;
      await new Promise((resolve, reject) => {
        imgElement.onload = () => resolve(true);
        imgElement.onerror = () =>
          reject(new Error("Failed to load image for preprocessing"));
      });

      const preprocessedData = preprocessImageCanvas(imgElement);
      const onnxTensor = new ort.Tensor("float32", preprocessedData, [
        1, 3, 224, 224,
      ]);

      const inputName = session.inputNames[0] || "input";
      const outputName = session.outputNames[0] || "output";
      const results = await session.run({ [inputName]: onnxTensor });
      const outputData = results[outputName].data as Float32Array;

      const maxLogit = Math.max(outputData[0], outputData[1]);
      const exp0 = Math.exp(outputData[0] - maxLogit);
      const exp1 = Math.exp(outputData[1] - maxLogit);
      const sum = exp0 + exp1;
      const bProb = exp0 / sum;
      const mProb = exp1 / sum;

      const threshold = 0.46;
      const label = mProb >= threshold ? "Malignant" : "Benign";

      let tier = "Low Risk (Benign)";
      let rLevel: "low" | "medium" | "high" = "low";
      if (mProb >= 0.75) {
        tier = "High Risk (Likely Malignant)";
        rLevel = "high";
      } else if (mProb >= threshold) {
        tier = "Medium Risk (Potentially Malignant)";
        rLevel = "medium";
      } else {
        tier = "Low Risk (Benign)";
        rLevel = "low";
      }

      const elapsed = Math.round(performance.now() - startTime);

      setPrediction(label);
      setMalignantProb(mProb);
      setBenignProb(bProb);
      setRiskTier(tier);
      setRiskLevel(rLevel);
      setInferenceTimeMs(elapsed);
      toast.success("Prediction completed");
    } catch (error) {
      console.error(
        "[SkinLesionDetector] Error running inference with student_model_quantized.onnx:",
        error,
      );
      toast.error("Failed to run prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto border-2 border-black bg-white shadow-[4px_4px_0px_#000] p-6">
      <div className="border-b-2 border-black pb-4 mb-6">
        <h3 className="text-xl font-black uppercase tracking-tight">
          DIRECT ONNX DETECTOR
        </h3>
        <p className="text-xs font-mono font-bold mt-1 text-stone-600 flex items-center gap-1.5">
          {session ? (
            <span className="inline-flex items-center text-emerald-800 gap-1 bg-emerald-100 px-2 py-0.5 border border-black">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              {modelStatus}
            </span>
          ) : (
            <span className="inline-flex items-center text-amber-800 gap-1 bg-amber-100 px-2 py-0.5 border border-black">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              {modelStatus}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="flex flex-wrap gap-3 w-full">
          <button
            onClick={captureImage}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-black bg-white hover:bg-stone-100 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <CameraIcon className="w-4 h-4" />
            <span>Capture Camera</span>
          </button>

          <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-black bg-white hover:bg-stone-100 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Upload className="w-4 h-4" />
            <span>Upload Photo</span>
          </label>
        </div>

        {imageSrc && (
          <div className="mt-2 w-full p-2 border-2 border-black bg-stone-900 shadow-[3px_3px_0px_#000] flex justify-center">
            <img
              src={imageSrc}
              alt="Lesion candidate"
              className="w-48 h-48 object-cover border border-black"
            />
          </div>
        )}

        {imageSrc && (
          <button
            onClick={runInference}
            disabled={loading || !session}
            className="w-full py-3.5 px-4 border-2 border-black bg-emerald-400 hover:bg-emerald-300 font-mono text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Inference (WASM)...</span>
              </>
            ) : (
              <span>Evaluate Lesion (student_model_quantized.onnx)</span>
            )}
          </button>
        )}

        {prediction && malignantProb !== null && benignProb !== null && (
          <div className="w-full space-y-4 mt-4">
            {/* Top Card */}
            <div
              className={`border-2 border-black p-4 flex items-center justify-between shadow-[3px_3px_0px_#000] ${
                riskLevel === "low"
                  ? "bg-emerald-50"
                  : riskLevel === "medium"
                    ? "bg-amber-50"
                    : "bg-rose-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#000] ${
                    riskLevel === "low"
                      ? "bg-emerald-300 text-black"
                      : riskLevel === "medium"
                        ? "bg-amber-300 text-black"
                        : "bg-rose-300 text-black"
                  }`}
                >
                  {riskLevel === "low" ? (
                    <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                  ) : riskLevel === "medium" ? (
                    <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>

                <div>
                  <div
                    className={`inline-flex items-center px-2 py-0.5 border-2 border-black text-[11px] font-mono font-bold uppercase shadow-[2px_2px_0px_#000] ${
                      riskLevel === "low"
                        ? "bg-emerald-300 text-black"
                        : riskLevel === "medium"
                          ? "bg-amber-300 text-black"
                          : "bg-rose-300 text-black"
                    }`}
                  >
                    {riskTier}
                  </div>
                  <p className="text-xs font-mono text-stone-700 mt-1">
                    Confidence:{" "}
                    <span className="font-black text-black">
                      {(
                        (prediction === "Benign" ? benignProb : malignantProb) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </p>
                </div>
              </div>

              <div className="border-l-2 border-black pl-3 text-xs font-mono space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-stone-600 font-bold">Benign:</span>
                  <span className="font-black text-emerald-700">
                    {(benignProb * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-stone-600 font-bold">Malignant:</span>
                  <span className="font-black text-rose-700">
                    {(malignantProb * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Card */}
            <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_#000]">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-xs font-black font-mono tracking-wider uppercase text-black">
                    MALIGNANCY PROBABILITY
                  </h4>
                  <p className="text-[10px] font-mono text-stone-600">
                    Threshold: 0.46
                  </p>
                </div>
                <span
                  className={`text-2xl font-black font-mono ${
                    riskLevel === "low"
                      ? "text-emerald-700"
                      : riskLevel === "medium"
                        ? "text-amber-700"
                        : "text-rose-700"
                  }`}
                >
                  {(malignantProb * 100).toFixed(1)}%
                </span>
              </div>

              <div className="relative w-full h-4 bg-stone-100 border-2 border-black overflow-hidden mt-2">
                <div
                  className={`h-full border-r-2 border-black ${
                    riskLevel === "low"
                      ? "bg-emerald-400"
                      : riskLevel === "medium"
                        ? "bg-amber-400"
                        : "bg-rose-400"
                  }`}
                  style={{
                    width: `${Math.min(Math.max(malignantProb * 100, 0), 100)}%`,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-black z-10 pointer-events-none"
                  style={{ left: "46%" }}
                />
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-black z-10 pointer-events-none"
                  style={{ left: "75%" }}
                />
              </div>

              <div className="relative w-full text-[10px] font-mono font-bold mt-1.5 h-4">
                <span className="text-emerald-700 absolute left-0">
                  0% (Benign)
                </span>
                <span className="text-amber-800 absolute left-[46%] -translate-x-1/2">
                  ▲ 46%
                </span>
                <span className="text-rose-800 absolute left-[75%] -translate-x-1/2">
                  ▲ 75%
                </span>
                <span className="text-rose-800 absolute right-0">100%</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-stone-600">
              <Clock className="w-3.5 h-3.5 text-black" />
              <span>Inference completed in {inferenceTimeMs || 100} ms</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkinLesionDetector;
