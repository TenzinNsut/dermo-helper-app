import React from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Image, ShieldAlert, Info } from "lucide-react";
import Layout from "@/components/Layout";
import ActionButton from "@/components/ActionButton";
import OfflineReadyBadge from "@/components/OfflineReadyBadge";

const Index = () => {
  const navigate = useNavigate();

  return (
    <Layout className="justify-between">
      <div className="flex flex-col items-center justify-center flex-1 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <ShieldAlert className="w-12 h-12 text-primary" />
        </div>

        <h1 className="text-3xl font-medium mb-2 text-center">
          Skin Cancer Detection
        </h1>

        <p className="text-muted-foreground text-center max-w-md mb-6">
          Take or upload a photo of concerning skin areas for instant
          CNN-powered analysis.
        </p>

        {/* Offline Ready Status: ONLY displays once model is loaded into memory */}
        {/* <div className="mb-8 min-h-[32px] flex items-center justify-center">
          <OfflineReadyBadge variant="full" />
        </div> */}

        <div
          className="flex flex-col gap-4 w-full max-w-xs animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <ActionButton
            icon={<Camera className="w-5 h-5" />}
            size="lg"
            className="w-full"
            onClick={() => navigate("/camera")}
          >
            Take a Photo
          </ActionButton>

          <ActionButton
            icon={<Image className="w-5 h-5" />}
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              // Create an input element and trigger click
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (typeof event.target?.result === "string") {
                      // Set the captured image in context and navigate
                      navigate("/results", {
                        state: { imageData: event.target.result },
                      });
                    }
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
          >
            Upload from Gallery
          </ActionButton>
        </div>
      </div>

      <div className="mt-12 rounded-lg p-4 bg-yellow-50 border border-yellow-100 animate-scale-in">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium mb-1">
              Important Medical Disclaimer
            </h3>
            <p className="text-xs text-muted-foreground">
              This app is for preliminary screening only and does not replace
              professional medical diagnosis. Always consult a healthcare
              provider for proper evaluation. Dermo Helper is an experimental
              CNN-based classification tool operating entirely on client-side
              WebAssembly.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
