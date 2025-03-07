"use client";

import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Image as LucideImage,
  MousePointerSquareDashed,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import Dropzone, { FileRejection } from "react-dropzone";

const Page = () => {
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [isUploadComplete, setIsUploadComplete] = useState(false);

  useEffect(() => {
    if (uploadProgress === 100 && !isUploadComplete) {
      console.log("Upload reached 100%, waiting for completion callback...");
      const timer = setTimeout(() => {
        if (!isUploadComplete) {
          console.log("Upload completion callback didn't trigger, forcing completion...");
          setIsUploadComplete(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress, isUploadComplete]);

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: ([data]) => {
      console.log("Upload completed callback triggered:", data);
      setIsUploadComplete(true);
      
      if (!data) {
        console.error("No data received from upload");
        toast({
          title: "Upload Error",
          description: "No data received from upload",
          variant: "destructive",
        });
        return;
      }

      console.log(data)

      const configId = data?.serverData?.configId;
      console.log("Extracted Config ID:", configId);

      if (!configId) {
        console.error("No configId in response. Full response:", data);
        toast({
          title: "Upload Error",
          description: "Configuration ID not received",
          variant: "destructive",
        });
        return;
      }

      startTransition(() => {
        console.log("Starting navigation to configure/design page");
        try {
          router.push(`/configure/design?id=${configId}`);
          console.log("Navigation initiated");
        } catch (error) {
          console.error("Navigation error:", error);
          toast({
            title: "Navigation Error",
            description: "Failed to navigate to design page",
            variant: "destructive",
          });
        }
      });
    },
    onUploadProgress(p) {
      console.log("Upload progress:", p);
      setUploadProgress(p);
    },
    onUploadError: (error) => {
      console.error("Upload error occurred:", error);
      setIsUploadComplete(false);
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      });
    },
  });

  const onDropRejected = (rejectedFiles: FileRejection[]) => {
    const [file] = rejectedFiles;
    console.log("File rejected:", file);
    setIsDragOver(false);
    toast({
      title: `${file.file.type} type is not supported.`,
      description: "Please choose a PNG, JPG, or JPEG image instead.",
      variant: "destructive",
    });
  };

  const onDropAccepted = (acceptedFiles: File[]) => {
    console.log("Files accepted:", acceptedFiles);
    setIsUploadComplete(false);
    setUploadProgress(0);
    startUpload(acceptedFiles, { configId: undefined });
    setIsDragOver(false);
  };


  

  return (
    <div
      className={cn(
        "relative h-full flex-1 my-16 w-full rounded-xl bg-gray-500/5 p-2 ring-1 ring-inset ring-slate-50/10 lg:rounded-2xl flex justify-center flex-col items-center",
        {
          "ring-blue-900/25 bg-blue-900/10": isDragOver,
        }
      )}
    >
      <div className="relative flex flex-1 flex-col items-center justify-center w-full">
        <Dropzone
          onDropRejected={onDropRejected}
          onDropAccepted={onDropAccepted}
          accept={{
            "image/png": [".png"],
            "image/jpeg": [".jpeg"],
            "image/jpg": [".jpg"],
          }}
          onDragEnter={() => setIsDragOver(true)}
          onDragLeave={() => setIsDragOver(false)}
        >
          {({ getRootProps, getInputProps }) => (
            <div
              className="h-full w-full flex-1 flex flex-col items-center justify-center"
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              {isDragOver ? (
                <MousePointerSquareDashed className="h-6 w-6 text-white mb-2" />
              ) : isUploading || isPending ? (
                <Loader2 className="animate-spin h-6 w-6 text-white mb-2" />
              ) : (
                <LucideImage className="h-6 w-6 text-white mb-2" />
              )}
              <div className="flex flex-col justify-center mb-2 text-sm text-white">
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <p>Uploading...</p>
                    <Progress
                      value={uploadProgress}
                      className="mt-2 w-40 h-2 bg-gray-300"
                    />
                  </div>
                ) : isPending ? (
                  <div className="flex flex-col items-center">
                    <p>Processing upload and preparing to redirect...</p>
                  </div>
                ) : isDragOver ? (
                  <p>
                    <span className="font-semibold">Drop file</span> to upload
                  </p>
                ) : (
                  <p>
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                )}
              </div>

              {isPending ? null : (
                <p className="text-xs text-white">PNG, JPG, JPEG</p>
              )}
            </div>
          )}
        </Dropzone>
      </div>
    </div>
  );
};

export default Page;