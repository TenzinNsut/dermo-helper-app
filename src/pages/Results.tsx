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
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// Initialize pdfMake with fonts (with type assertion)
(pdfMake as any).vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

// Helper to determine if we're running in a Capacitor app
const isCapacitorApp = () => {
  return Boolean(window.Capacitor?.isNativePlatform());
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
    // If already a data URL, extract the base64 part
    if (dataUrl.startsWith("data:")) {
      return dataUrl.split(",")[1];
    }
    return dataUrl;
  };

  // Convert WebP images to JPEG for better PDF compatibility
  const convertWebPToJpeg = async (imageData: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create an image element to load the WebP
        const img = new Image();
        img.onload = () => {
          // Create a canvas to draw and convert the image
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw the image on the canvas
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0);

          // Convert to JPEG format
          const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.9);
          resolve(jpegDataUrl);
        };

        img.onerror = (error) => {
          console.error("Error loading image for conversion:", error);
          // If conversion fails, return the original image
          resolve(imageData);
        };

        img.src = imageData;
      } catch (error) {
        console.error("Error in WebP conversion:", error);
        // If anything goes wrong, return the original
        resolve(imageData);
      }
    });
  };

  // Create simplified PDF definition - focus on minimal structure for maximum compatibility
  const createPdfDefinition = (
    results: PredictionResult,
    imageData: string,
  ) => {
    const imageBase64 = getBase64FromDataUrl(imageData);
    const currentDate = new Date().toLocaleString();
    const confidencePercentage = Math.round(results.confidence * 100);

    // Basic description text with no special formatting
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

    // Plain warning text (only for medium/high risk)
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

    // Create a very basic PDF document definition with minimal styling
    return {
      pageSize: "A4",
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          text: "Skin Analysis Report",
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
          text: "This is an AI-generated assessment and should not be considered as a medical diagnosis.",
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

      // Ensure image is in compatible format
      const compatibleImage = await convertWebPToJpeg(imageData);

      // Generate PDF with pdfmake - using binary output for better compatibility
      const pdfDoc = pdfMake.createPdf(
        createPdfDefinition(results, compatibleImage),
      );

      // Create filename
      const timestamp = new Date().getTime();
      const fileName = `skin-report-${timestamp}.pdf`;

      // Get PDF as Uint8Array
      const pdfBytes = await new Promise<Uint8Array>((resolve) => {
        pdfDoc.getBuffer((buffer) => {
          resolve(buffer);
        });
      });

      // Convert to base64 for Capacitor Filesystem
      const pdfBase64 = btoa(
        Array.from(new Uint8Array(pdfBytes))
          .map((b) => String.fromCharCode(b))
          .join(""),
      );

      // For sharing, use Cache directory
      if (forSharing) {
        try {
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: pdfBase64,
            directory: Directory.Cache,
          });

          return { uri: savedFile.uri, path: "temporary storage" };
        } catch (error) {
          console.error("Error saving to cache:", error);
          throw error;
        }
      } else {
        try {
          // Try Documents directory first (Android 10+)
          try {
            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: pdfBase64,
              directory: Directory.Documents,
            });

            return { uri: savedFile.uri, path: "Documents folder" };
          } catch (docError) {
            console.error("Error saving to Documents:", docError);

            // Try ExternalStorage with Download path
            try {
              const savedFile = await Filesystem.writeFile({
                path: `Download/${fileName}`,
                data: pdfBase64,
                directory: Directory.ExternalStorage,
              });

              return { uri: savedFile.uri, path: "Downloads folder" };
            } catch (downloadError) {
              console.error("Error saving to Downloads:", downloadError);

              // Last try - Data directory
              const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: pdfBase64,
                directory: Directory.Data,
              });

              return { uri: savedFile.uri, path: "app storage" };
            }
          }
        } catch (error) {
          console.error("All save attempts failed:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Error generating or saving PDF:", error);
      toast({
        title: "Save failed",
        description: "Unable to save the report. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Save PDF report on web browsers (both desktop and mobile)
  const saveWebPdf = async (
    results: PredictionResult,
    imageData: string,
  ): Promise<boolean> => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait...",
      });

      // Process image for PDF compatibility
      const compatibleImage = await convertWebPToJpeg(imageData);

      // Create PDF content
      const documentDefinition = createPdfDefinition(results, compatibleImage);

      // Create simple filename
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `dermohelper-report-${timestamp}.pdf`;

      // Create PDF with type assertion
      const pdfDoc = (pdfMake as any).createPdf(documentDefinition);

      // Use the simplest most reliable approach
      return new Promise<boolean>((resolve) => {
        try {
          // Download approach for mobile browsers
          if (isMobileBrowser()) {
            // Generate base64 and use a data URL download
            pdfDoc.getBase64((base64: string) => {
              try {
                const pdfDataUri = `data:application/pdf;base64,${base64}`;

                // Create an anchor element for download
                const downloadLink = document.createElement("a");
                downloadLink.href = pdfDataUri;
                downloadLink.download = fileName;
                downloadLink.style.display = "none";

                // Append to body, click to trigger download, then remove
                document.body.appendChild(downloadLink);
                downloadLink.click();

                // Some browsers need time to process the click
                setTimeout(() => {
                  document.body.removeChild(downloadLink);

                  toast({
                    title: "Report ready",
                    description: "PDF has been downloaded to your device",
                  });

                  resolve(true);
                }, 100);
              } catch (err) {
                console.error("Error creating download link:", err);

                toast({
                  title: "Save failed",
                  description: "Unable to save PDF. Please try again.",
                  variant: "destructive",
                });

                resolve(false);
              }
            });
          } else {
            // For desktop browsers use FileServer
            pdfDoc.getBuffer((buffer: Uint8Array) => {
              try {
                const blob = new Blob([buffer], { type: "application/pdf" });
                saveAs(blob, fileName);

                toast({
                  title: "Report ready",
                  description: "PDF has been downloaded to your device",
                });

                resolve(true);
              } catch (err) {
                console.error("Error saving PDF with blob:", err);

                toast({
                  title: "Save failed",
                  description: "Unable to save PDF. Please try again.",
                  variant: "destructive",
                });

                resolve(false);
              }
            });
          }
        } catch (err) {
          console.error("Unexpected error in PDF generation:", err);

          toast({
            title: "Save failed",
            description: "Unable to generate PDF. Please try again.",
            variant: "destructive",
          });

          resolve(false);
        }
      });
    } catch (error) {
      console.error("Error in saveWebPdf:", error);

      toast({
        title: "Save failed",
        description: "Unable to generate the report. Please try again.",
        variant: "destructive",
      });

      return false;
    }
  };

  // Simplified text-only sharing for mobile web browsers
  const shareResults = async (results: PredictionResult): Promise<boolean> => {
    try {
      // Create simple text summary to share
      const shareText = `DermoHelper Analysis: ${results.prediction} (${Math.round(results.confidence * 100)}% confidence, ${results.riskLevel === "low" ? "Low" : results.riskLevel === "medium" ? "Medium" : "High"} risk level)`;

      // First try Web Share API (works on most mobile browsers)
      if (navigator.share) {
        await navigator.share({
          title: "Skin Analysis Results",
          text: shareText,
        });

        toast({
          title: "Shared successfully",
          description: "Analysis results have been shared",
        });

        return true;
      }

      // Otherwise try clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);

        toast({
          title: "Copied to clipboard",
          description: "Results copied and ready to paste",
        });

        return true;
      }

      // Last resort fallback - show alert with text to copy manually
      alert("Copy this result:\n\n" + shareText);

      toast({
        title: "Manual copy needed",
        description: "Please copy the text from the alert box",
      });

      return true;
    } catch (error) {
      console.error("Error sharing results:", error);

      toast({
        title: "Share failed",
        description: "Unable to share results. Please try again.",
        variant: "destructive",
      });

      return false;
    }
  };

  useEffect(() => {
    const data = location.state?.imageData;
    if (data) {
      // Log the type and beginning of image data to help with debugging
      console.log(
        "Received image data:",
        typeof data === "string"
          ? `${data.substring(0, 30)}... (${data.length} characters)`
          : "not a string",
      );

      setImageData(data);

      // Initialize model and analyze image
      initializeModelAndAnalyze(data);
    } else {
      // No image provided, redirect back to home
      navigate("/");
    }
  }, [location.state, navigate]);

  const initializeModelAndAnalyze = async (imageData: string) => {
    setIsAnalyzing(true);
    setModelError(null);

    try {
      console.log(
        "[Results] Evaluating image directly with student_model_quantized.onnx...",
      );
      const prediction = await modelService.predict(imageData);
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
      <div className="flex flex-col animate-fade-in max-w-xl mx-auto w-full">
        {/* Image preview */}
        <div className="mb-6">
          {imageData && (
            <ImagePreview
              src={imageData}
              className="w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-sm border"
            />
          )}
        </div>

        {/* Analysis section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>

          {modelError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 text-sm">{modelError}</p>
            </div>
          )}

          {isAnalyzing ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-8 flex flex-col items-center shadow-sm">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-base font-medium text-slate-800">
                Evaluating with student_model_quantized.onnx...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Calibrating against clinical threshold (0.46)
              </p>
            </div>
          ) : results ? (
            <div className="space-y-4 animate-scale-in">
              {/* TOP CARD: Detailed Risk Stratification (Clean Whitish Style) */}
              <div
                className={`bg-white border rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-sm ${
                  results.riskLevel === "low"
                    ? "border-emerald-200/80 bg-emerald-50/20"
                    : results.riskLevel === "medium"
                      ? "border-amber-200/80 bg-amber-50/20"
                      : "border-red-200/80 bg-red-50/20"
                }`}
              >
                <div className="flex items-center gap-3.5 md:gap-4">
                  {/* Status Icon container */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                      results.riskLevel === "low"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : results.riskLevel === "medium"
                          ? "bg-amber-50 border-amber-200 text-amber-600"
                          : "bg-red-50 border-red-200 text-red-600"
                    }`}
                  >
                    {results.riskLevel === "low" ? (
                      <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                    ) : results.riskLevel === "medium" ? (
                      <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
                    )}
                  </div>

                  <div>
                    {/* Status Pill Badge */}
                    <div
                      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase border ${
                        results.riskLevel === "low"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : results.riskLevel === "medium"
                            ? "bg-amber-50 border-amber-300 text-amber-700"
                            : "bg-red-50 border-red-300 text-red-700"
                      }`}
                    >
                      {results.riskLevel === "low"
                        ? "LOW RISK (BENIGN)"
                        : results.riskLevel === "medium"
                          ? "MEDIUM RISK (POTENTIALLY MALIGNANT)"
                          : "HIGH RISK (LIKELY MALIGNANT)"}
                    </div>

                    {/* Primary Confidence Text */}
                    <p className="text-sm text-slate-600 mt-1 font-normal">
                      Confidence:{" "}
                      <span className="font-bold text-slate-900">
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
                <div className="border-l border-slate-200 pl-4 md:pl-6 text-xs md:text-sm flex flex-col justify-center space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-medium">Benign:</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {(results.benignProb * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-medium">
                      Malignant:
                    </span>
                    <span className="font-bold text-red-600 font-mono">
                      {(results.malignantProb * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTTOM CARD: Malignancy Probability Bar with Cutoff Dividers (Clean Whitish Style) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-xs md:text-sm font-semibold tracking-wider text-slate-700 uppercase">
                      MALIGNANCY PROBABILITY
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Calibrated against clinical threshold (0.46)
                    </p>
                  </div>

                  {/* Giant Malignancy Percentage */}
                  <span
                    className={`text-xl md:text-2xl font-bold tracking-tight  ${
                      results.riskLevel === "low"
                        ? "text-emerald-600"
                        : results.riskLevel === "medium"
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {(results.malignantProb * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Multi-tier Progress Bar */}
                <div className="relative w-full h-3.5 bg-slate-100 border border-slate-200/70 rounded-full overflow-hidden mt-4">
                  {/* Active Progress Fill */}
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      results.riskLevel === "low"
                        ? "bg-emerald-500"
                        : results.riskLevel === "medium"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(Math.max(results.malignantProb * 100, 0), 100)}%`,
                    }}
                  />
                  {/* 46% Cutoff Tick Mark Divider */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-amber-500 z-10 pointer-events-none"
                    style={{ left: "46%" }}
                  />
                  {/* 75% High Risk Tick Mark Divider */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none"
                    style={{ left: "75%" }}
                  />
                </div>

                {/* Axis Labels & Cutoff Markers */}
                <div className="relative w-full text-[11px] md:text-xs font-mono font-medium mt-2.5 h-5">
                  <span className="text-emerald-600 font-semibold absolute left-0">
                    0% (Benign)
                  </span>
                  <span className="text-amber-600 font-semibold absolute left-[46%] -translate-x-1/2 flex items-center gap-0.5 whitespace-nowrap">
                    ▲ 46% Cutoff
                  </span>
                  <span className="text-red-600 font-semibold absolute left-[75%] -translate-x-1/2 flex items-center gap-0.5 whitespace-nowrap">
                    ▲ 75% High Risk
                  </span>
                  <span className="text-red-600 font-semibold absolute right-0">
                    100%
                  </span>
                </div>
              </div>

              {/* Inference Time Footer */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>
                  Inference completed in {results.inferenceTimeMs || 100} ms
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Action buttons */}
        {results && (
          <div
            className="grid grid-cols-2 gap-4 mb-6 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <ActionButton
              variant="outline"
              icon={<Share2 className="w-4 h-4" />}
              className="text-sm"
              onClick={async () => {
                // Share results as text (more reliable)
                if (results) {
                  try {
                    // Share directly using our simplified sharing function
                    await shareResults(results);
                  } catch (error) {
                    console.error("Error sharing results:", error);
                    toast({
                      title: "Share failed",
                      description: "Unable to share results. Please try again.",
                      variant: "destructive",
                    });
                  }
                }
              }}
            >
              Share Results
            </ActionButton>

            <ActionButton
              variant="outline"
              icon={<Download className="w-4 h-4" />}
              className="text-sm"
              onClick={async () => {
                // Generate and save a PDF report
                if (results && imageData) {
                  try {
                    if (isCapacitorApp()) {
                      // For Capacitor app, save using Capacitor Filesystem
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

                        // User tip
                        setTimeout(() => {
                          toast({
                            title: "Tip",
                            description:
                              "Open Files app to view the PDF in Documents or Downloads folder",
                          });
                        }, 2000);
                      }
                    } else {
                      // For all web browsers (desktop or mobile)
                      await saveWebPdf(results, imageData);
                    }
                  } catch (error) {
                    console.error("Error saving report:", error);
                    toast({
                      title: "Save failed",
                      description:
                        "Unable to save the report. Please try again.",
                      variant: "destructive",
                    });
                  }
                }
              }}
            >
              Save Report
            </ActionButton>
          </div>
        )}

        {/* Next actions */}
        <div className="mt-auto">
          <ActionButton
            className="w-full"
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            onClick={() => navigate("/")}
          >
            Scan Another Image
          </ActionButton>
        </div>
      </div>
    </Layout>
  );
};

export default Results;
