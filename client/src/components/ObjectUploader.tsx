import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import XHRUpload from "@uppy/xhr-upload";
import Webcam from "@uppy/webcam";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    uppy: Uppy
  ) => void;
  buttonClassName?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "secondary";
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onComplete,
  buttonClassName,
  buttonVariant = "default",
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['image/*'],
      },
      autoProceed: false,
    })
      .use(Webcam, {
        modes: ['picture'],
        mirror: true,
        // @ts-ignore - facingMode is a valid webcam option but missing from types
        facingMode: 'environment',
      })
      .use(XHRUpload, {
        endpoint: '/api/upload',
        formData: true,
        fieldName: 'file',
        getResponseData: (xhr: XMLHttpRequest) => {
          const response = JSON.parse(xhr.responseText);
          return { url: response.url };
        },
      })
      .on("complete", (result: any) => {
        onComplete?.(result, uppy);
        setShowModal(false);
      })
  );

  useEffect(() => {
    return () => {
      try {
        // @ts-ignore - close() exists but may not be in all type definitions
        uppy.close({ reason: 'unmount' });
      } catch (e) {
        console.warn('Failed to close Uppy instance:', e);
      }
    };
  }, [uppy]);

  return (
    <div>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        variant={buttonVariant}
        type="button"
      >
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note="Scatta una foto o seleziona dalla libreria"
      />
    </div>
  );
}
