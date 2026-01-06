import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import XHRUpload from "@uppy/xhr-upload";
import Webcam from "@uppy/webcam";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Camera, CameraResultType, CameraSource, CameraDirection } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

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
  const isNative = Capacitor.getPlatform() !== 'web';

  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['image/*'],
      },
      autoProceed: false,
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
        onComplete?.(result, uppyInstance);
        setShowModal(false);
      });

    // Only add Webcam plugin for web platform
    if (!isNative) {
      uppyInstance.use(Webcam, {
        modes: ['picture'],
        mirror: true,
        // @ts-ignore - facingMode is a valid webcam option but missing from types
        facingMode: 'environment',
      });
    }

    return uppyInstance;
  });

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

  const handleClick = async () => {
    console.log('Platform:', Capacitor.getPlatform(), 'isNative:', isNative);

    // On mobile (Android/iOS), use native camera
    if (isNative) {
      try {
        console.log('Using Capacitor Camera');
        const image = await Camera.getPhoto({
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt,
          quality: 90,
          allowEditing: false,
          saveToGallery: false,
          correctOrientation: true,
          direction: CameraDirection.Rear,
        });

        console.log('Image captured');

        if (image.webPath) {
          // Convert URI to blob using fetch (works for both camera and gallery)
          const response = await fetch(image.webPath);
          const blob = await response.blob();

          const imageFormat = image.format || 'jpeg';
          const fileName = `photo_${Date.now()}.${imageFormat}`;
          const file = new File([blob], fileName, { type: `image/${imageFormat}` });

          console.log('File created:', file.name, 'size:', blob.size);

          uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
          });

          console.log('File added to uppy, starting upload');

          // Trigger upload
          const result = await uppy.upload();
          console.log('Upload result:', result);
        }
      } catch (error: any) {
        console.error('Camera error:', error);
        if (error.message && !error.message.includes('cancel')) {
          alert('Errore apertura fotocamera: ' + error.message);
        }
      }
    } else {
      console.log('Using Uppy modal');
      // On web, use Uppy modal with webcam
      setShowModal(true);
    }
  };

  return (
    <div>
      <Button
        onClick={handleClick}
        className={buttonClassName}
        variant={buttonVariant}
        type="button"
      >
        {children}
      </Button>

      {!isNative && (
        <DashboardModal
          uppy={uppy}
          open={showModal}
          onRequestClose={() => setShowModal(false)}
          proudlyDisplayPoweredByUppy={false}
          note="Scatta una foto o seleziona dalla libreria"
        />
      )}
    </div>
  );
}
