import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Share2,
  Download,
  ArrowRight,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import Layout from "@/components/Layout";
import ActionButton from "@/components/ActionButton";
import ImagePreview from "@/components/ImagePreview";
import { modelService, PredictionResult } from "@/services/modelService";
import { useToast } from "@/hooks/use-toast";
// Import pdfmake for PDF generation
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
// Import file-saver for downloading files on web
import { saveAs } from "file-saver";
// Import Capacitor plugins for file operations
import { Filesystem, Directory } from "@capacitor/filesystem";

// Initialize pdfMake with fonts (with type assertion)
(pdfMake as any).vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

// Helper to determine if we're running in a Capacitor app
const isCapacitorApp = () => {
  return Boolean(window.Capacitor?.isNativePlatform());
};

const isMobileBrowser = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageData, setImageData] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PredictionResult | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);

  // Convert image data URL to base64 for PDF
  const getBase64FromDataUrl = (dataUrl: string): string => {
    if (dataUrl.startsWith("data:")) {
      return dataUrl.split(",")[1];
    }
    return dataUrl;
  };

  // Convert WebP images to JPEG for better PDF compatibility
  const convertWebPToJpeg = async (imageData: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0);
          const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.9);
          resolve(jpegDataUrl);
        };
        img.onerror = (error) => {
          console.error("Error loading image for conversion:", error);
          resolve(imageData);
        };
        img.src = imageData;
      } catch (error) {
        console.error("Error in WebP conversion:", error);
        resolve(imageData);
      }
    });
  };

  // Create simplified PDF definition
  const createPdfDefinition = (
    results: PredictionResult,
    imageData: string,
  ) => {
    const imageBase64 = getBase64FromDataUrl(imageData);
    const currentDate = new Date().toLocaleString();
    const confidencePercentage = Math.round(results.confidence * 100);

    const getRiskDescription = () => {
      switch (results.riskLevel) {
        case "low":
          return "The image appears to show characteristics consistent with benign skin conditions.";
        case "medium":
          return "The image shows some concerning features that may require medical attention.";
        case "high":
          return "The image shows features highly suggestive of a potential malignancy.";
        default:
          return "";
      }
    };

    const warningText =
      results.riskLevel !== "low"
        ? [
            {
              text: "Please consult with a healthcare professional as soon as possible for a proper evaluation.",
              fontSize: 10,
              color: "#ff8f00",
              margin: [0, 5, 0, 15],
            },
          ]
        : [];

    return {
      pageSize: "A4",
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          text: "Skin Analysis Report - MAG-KD DermoHelper",
          fontSize: 18,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 15],
        },
        {
          image: "data:image/jpeg;base64," + imageBase64,
          width: 250,
          alignment: "center",
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            headerRows: 1,
            widths: ["40%", "*"],
            body: [
              ["Analysis Result:", results.prediction],
              ["Confidence:", `${confidencePercentage}%`],
              [
                "Risk Level:",
                `${results.riskLevel === "low" ? "Low" : results.riskLevel === "medium" ? "Medium" : "High"} Risk`,
              ],
              ["Malignancy Probability:", `${(results.malignantProb * 100).toFixed(1)}%`],
              ["Benign Probability:", `${(results.benignProb * 100).toFixed(1)}%`],
              ["Clinical Threshold:", "0.46 (High Sensitivity)"],
            ],
          },
          margin: [0, 0, 0, 20],
        },
        {
          text: getRiskDescription(),
          margin: [0, 0, 0, 10],
        },
        ...warningText,
        {
          text: `Report generated on ${currentDate}`,
          fontSize: 10,
          color: "#666666",
          margin: [0, 15, 0, 5],
        },
        {
          text: "DISCLAIMER: This is an AI-assisted screening assessment and not a medical diagnosis. Always consult a certified dermatologist.",
          fontSize: 9,
          color: "#999999",
          alignment: "center",
          margin: [0, 10, 0, 0],
        },
      ],
    };
  };

  // Save PDF to device (Android/iOS)
  const saveMobilePdf = async (
    results: PredictionResult,
    imageData: string,
    forSharing = false,
  ): Promise<{ uri: string; path?: string } | null> => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait...",
      });

      const compatibleImage = await convertWebPToJpeg(imageData);
      const pdfDoc = pdfMake.createPdf(
        createPdfDefinition(results, compatibleImage),
      );

      const timestamp = new Date().getTime();
      const fileName = `skin-report-${timestamp}.pdf`;

      const pdfBytes = await new Promise<Uint8Array>((resolve) => {
        pdfDoc.getBuffer((buffer) => {
          resolve(buffer);
        });
      });

      const pdfBase64 = btoa(
        Array.from(new Uint8Array(pdfBytes))
          .map((b) => String.fromCharCode(b))
          .join(""),
      );

      if (forSharing) {
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache,
        });
        return { uri: savedFile.uri, path: "temporary storage" };
      } else {
        try {
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: pdfBase64,
            directory: Directory.Documents,
          });
          return { uri: savedFile.uri, path: "Documents folder" };
        } catch {
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: pdfBase64,
            directory: Directory.Data,
          });
          return { uri: savedFile.uri, path: "app storage" };
        }
      }
    } catch (error) {
      console.error("Error generating or saving PDF:", error);
      toast({
        title: "Save failed",
        description: "Unable to save report.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Save PDF report on web browsers
  const saveWebPdf = async (
    results: PredictionResult,
    imageData: string,
  ): Promise<boolean> => {
    try {
      toast({
        title: "Generating PDF",
        description: "Compiling brutalist report...",
      });

      const compatibleImage = await convertWebPToJpeg(imageData);
      const documentDefinition = createPdfDefinition(results, compatibleImage);
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `dermohelper-report-${timestamp}.pdf`;
      const pdfDoc = (pdfMake as any).createPdf(documentDefinition);

      return new Promise<boolean>((resolve) => {
        if (isMobileBrowser()) {
          pdfDoc.getBase64((base64: string) => {
            try {
              const pdfDataUri = `data:application/pdf;base64,${base64}`;
              const downloadLink = document.createElement("a");
              downloadLink.href = pdfDataUri;
              downloadLink.download = fileName;
              downloadLink.style.display = "none";
              document.body.appendChild(downloadLink);
              downloadLink.click();
              setTimeout(() => {
                document.body.removeChild(downloadLink);
                toast({
                  title: "Report Downloaded",
                  description: "PDF report saved to downloads.",
                });
                resolve(true);
              }, 100);
            } catch (err) {
              console.error(err);
              toast({
                title: "Save failed",
                description: "Could not create PDF download.",
                variant: "destructive",
              });
              resolve(false);
            }
          });
        } else {
          pdfDoc.getBuffer((buffer: Uint8Array) => {
            try {
              const blob = new Blob([buffer], { type: "application/pdf" });
              saveAs(blob, fileName);
              toast({
                title: "Report Downloaded",
                description: "PDF report saved to downloads.",
              });
              resolve(true);
            } catch (err) {
              console.error(err);
              toast({
                title: "Save failed",
                description: "Could not create PDF blob.",
                variant: "destructive",
              });
              resolve(false);
            }
          });
        }
      });
    } catch (error) {
      console.error("Error in saveWebPdf:", error);
      toast({
        title: "Save failed",
        description: "Unable to generate report.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Simplified text-only sharing
  const shareResults = async (results: PredictionResult): Promise<boolean> => {
    try {
      const shareText = `DermoHelper Analysis Result: ${results.prediction.toUpperCase()} (Malignancy: ${(results.malignantProb * 100).toFixed(1)}%, Benign: ${(results.benignProb * 100).toFixed(1)}%, Threshold: 0.46, Inference: ${results.inferenceTimeMs || 100}ms)`;

      if (navigator.share) {
        await navigator.share({
          title: "DermoHelper Analysis",
          text: shareText,
        });
        toast({ title: "Shared successfully" });
        return true;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "Copied to clipboard" });
        return true;
      }

      alert("Copy this result:\n\n" + shareText);
      return true;
    } catch (error) {
      console.error("Error sharing results:", error);
      toast({
        title: "Share failed",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    const data = location.state?.imageData;
    if (data) {
      setImageData(data);
      initializeModelAndAnalyze(data);
    } else {
      navigate("/");
    }
  }, [location.state, navigate]);

  const initializeModelAndAnalyze = async (data: string) => {
    setIsAnalyzing(true);
    setModelError(null);

    try {
      console.log(
        "[Results] Evaluating image directly with student_model_quantized.onnx...",
      );
      const prediction = await modelService.predict(data);
      setResults(prediction);
    } catch (error: any) {
      console.error("[Results] Model evaluation error:", error);
      setModelError(
        error.message ||
          "Failed to evaluate image with student_model_quantized.onnx.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col max-w-xl mx-auto w-full pb-12">
        {/* Navigation back bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-white hover:bg-stone-100 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Studio</span>
          </button>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
            Analysis Output
          </span>
        </div>

        {/* Image preview frame (Brutalist border & shadow) */}
        <div className="mb-6 p-2 bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
          {imageData && (
            <div className="w-full h-64 md:h-80 bg-stone-900 border border-black overflow-hidden flex items-center justify-center">
              <ImagePreview
                src={imageData}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Analysis section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black uppercase tracking-tight">
              Screening Results
            </h2>
            <span className="font-mono text-xs bg-stone-100 border border-black px-2 py-0.5 font-bold uppercase">
              Opset 13 WASM
            </span>
          </div>

          {modelError && (
            <div className="mb-4 p-4 bg-rose-100 border-2 border-black shadow-[3px_3px_0px_#000] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-mono text-xs font-bold uppercase text-rose-900">
                  Inference Error
                </p>
                <p className="text-rose-800 text-sm mt-0.5">{modelError}</p>
              </div>
            </div>
          )}

          {isAnalyzing ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-8 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-black border-t-amber-400 animate-spin mb-4"></div>
              <p className="text-base font-bold font-mono uppercase text-black">
                Executing student_model_quantized.onnx...
              </p>
              <p className="text-xs font-mono text-stone-600 mt-1">
                Applying ImageNet CHW norm and clinical threshold (0.46)
              </p>
            </div>
          ) : results ? (
            <div className="space-y-4">
              {/* TOP CARD: Detailed Risk Stratification (Brutalist style) */}
              <div
                className={`border-2 border-black p-4 md:p-5 flex items-center justify-between shadow-[4px_4px_0px_#000] ${
                  results.riskLevel === "low"
                    ? "bg-emerald-50"
                    : results.riskLevel === "medium"
                      ? "bg-amber-50"
                      : "bg-rose-50"
                }`}
              >
                <div className="flex items-center gap-3.5 md:gap-4">
                  {/* Status Icon container */}
                  <div
                    className={`w-12 h-12 border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#000] ${
                      results.riskLevel === "low"
                        ? "bg-emerald-300 text-black"
                        : results.riskLevel === "medium"
                          ? "bg-amber-300 text-black"
                          : "bg-rose-300 text-black"
                    }`}
                  >
                    {results.riskLevel === "low" ? (
                      <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                    ) : results.riskLevel === "medium" ? (
                      <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
                    )}
                  </div>

                  <div>
                    {/* Status Pill Badge */}
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 border-2 border-black text-xs font-mono font-bold tracking-wider uppercase shadow-[2px_2px_0px_#000] ${
                        results.riskLevel === "low"
                          ? "bg-emerald-300 text-black"
                          : results.riskLevel === "medium"
                            ? "bg-amber-300 text-black"
                            : "bg-rose-300 text-black"
                      }`}
                    >
                      {results.riskLevel === "low"
                        ? "LOW RISK (BENIGN)"
                        : results.riskLevel === "medium"
                          ? "MEDIUM RISK (POTENTIALLY MALIGNANT)"
                          : "HIGH RISK (LIKELY MALIGNANT)"}
                    </div>

                    {/* Primary Confidence Text */}
                    <p className="text-sm font-mono text-stone-700 mt-1.5">
                      Confidence:{" "}
                      <span className="font-black text-black">
                        {(
                          (results.prediction === "Benign"
                            ? results.benignProb
                            : results.malignantProb) * 100
                        ).toFixed(1)}
                        %
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right Column: Class Probabilities Breakdown */}
                <div className="border-l-2 border-black pl-4 md:pl-6 text-xs md:text-sm font-mono flex flex-col justify-center space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-stone-600 font-bold">Benign:</span>
                    <span className="font-black text-emerald-700">
                      {(results.benignProb * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-stone-600 font-bold">Malignant:</span>
                    <span className="font-black text-rose-700">
                      {(results.malignantProb * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTTOM CARD: Malignancy Probability Bar with Cutoff Dividers (Brutalist style) */}
              <div className="bg-white border-2 border-black p-5 md:p-6 shadow-[4px_4px_0px_#000]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-xs md:text-sm font-black font-mono tracking-wider uppercase text-black">
                      MALIGNANCY PROBABILITY
                    </h4>
                    <p className="text-xs font-mono text-stone-600 mt-0.5">
                      Calibrated against clinical threshold (0.46)
                    </p>
                  </div>

                  {/* Giant Malignancy Percentage */}
                  <span
                    className={`text-2xl md:text-3xl font-black font-mono tracking-tight ${
                      results.riskLevel === "low"
                        ? "text-emerald-700"
                        : results.riskLevel === "medium"
                          ? "text-amber-700"
                          : "text-rose-700"
                    }`}
                  >
                    {(results.malignantProb * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Multi-tier Progress Bar */}
                <div className="relative w-full h-5 bg-stone-100 border-2 border-black overflow-hidden mt-4">
                  {/* Active Progress Fill */}
                  <div
                    className={`h-full border-r-2 border-black transition-all duration-700 ease-out ${
                      results.riskLevel === "low"
                        ? "bg-emerald-400"
                        : results.riskLevel === "medium"
                          ? "bg-amber-400"
                          : "bg-rose-400"
                    }`}
                    style={{
                      width: `${Math.min(Math.max(results.malignantProb * 100, 0), 100)}%`,
                    }}
                  />
                  {/* 46% Cutoff Tick Mark Divider */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-black z-10 pointer-events-none"
                    style={{ left: "46%" }}
                  />
                  {/* 75% High Risk Tick Mark Divider */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-black z-10 pointer-events-none"
                    style={{ left: "75%" }}
                  />
                </div>

                {/* Axis Labels & Cutoff Markers */}
                <div className="relative w-full text-[11px] md:text-xs font-mono font-bold mt-2.5 h-5">
                  <span className="text-emerald-700 absolute left-0">
                    0% (Benign)
                  </span>
                  <span className="text-amber-800 absolute left-[46%] -translate-x-1/2 flex items-center gap-0.5 whitespace-nowrap">
                    ▲ 46% Cutoff
                  </span>
                  <span className="text-rose-800 absolute left-[75%] -translate-x-1/2 flex items-center gap-0.5 whitespace-nowrap">
                    ▲ 75% High Risk
                  </span>
                  <span className="text-rose-800 absolute right-0">100%</span>
                </div>
              </div>

              {/* Inference Time Footer */}
              <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-600 px-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-black flex-shrink-0" />
                  <span>
                    Inference completed in {results.inferenceTimeMs || 100} ms
                  </span>
                </div>
                <span className="border border-black bg-stone-100 px-2 py-0.5 text-[11px]">
                  Zero Server Latency
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Action buttons */}
        {results && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <ActionButton
              variant="outline"
              icon={<Share2 className="w-4 h-4" />}
              className="text-xs md:text-sm font-bold uppercase tracking-wider"
              onClick={async () => {
                if (results) {
                  await shareResults(results);
                }
              }}
            >
              Share Results
            </ActionButton>

            <ActionButton
              variant="outline"
              icon={<Download className="w-4 h-4" />}
              className="text-xs md:text-sm font-bold uppercase tracking-wider"
              onClick={async () => {
                if (results && imageData) {
                  if (isCapacitorApp()) {
                    const savedFile = await saveMobilePdf(
                      results,
                      imageData,
                      false,
                    );
                    if (savedFile) {
                      toast({
                        title: "Report saved",
                        description: `PDF saved to ${savedFile.path || "device storage"}`,
                      });
                    }
                  } else {
                    await saveWebPdf(results, imageData);
                  }
                }
              }}
            >
              Save Report
            </ActionButton>
          </div>
        )}

        {/* Next actions */}
        <div className="space-y-4">
          <ActionButton
            className="w-full text-base font-black uppercase tracking-wider py-4 bg-emerald-400 hover:bg-emerald-300 text-black border-2 border-black shadow-[4px_4px_0px_#000]"
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            onClick={() => navigate("/")}
          >
            Scan Another Lesion
          </ActionButton>

          {/* Android App Download Promotion Banner */}
          <div className="p-4 bg-yellow-200 border-2 border-black shadow-[3px_3px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono font-bold text-black">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 flex-shrink-0" />
              <span>Offline field screening? Install native Android APK.</span>
            </div>
            <a
              href="https://github.com/TenzinNsut/dermo-helper-app/releases/tag/DermoHelperAPK"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase"
            >
              <span>Download APK</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Results;
