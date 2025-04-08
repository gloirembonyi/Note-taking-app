"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FaSearch, FaSpinner, FaDownload } from "react-icons/fa";

interface RelatedImagesProps {
  plantName: string | null;
}

export default function RelatedImages({ plantName }: RelatedImagesProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchRelatedImages = async () => {
      if (!plantName) return;

      setLoading(true);
      setError("");
      setLoadedImages(new Set());

      try {
        const response = await fetch(
          `/api/related-images?plant=${encodeURIComponent(plantName)}`
        );
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.images && Array.isArray(data.images)) {
          setImages(data.images);
        } else {
          throw new Error("Invalid image data received");
        }
      } catch (err) {
        setError("Failed to load related images");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedImages();
  }, [plantName]);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set([...prev, index]));
  };

  const downloadImage = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", url.split("/").pop() || "downloaded-image");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!plantName) return null;

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center py-4">
          <FaSpinner className="text-[#52B788] text-xl animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-400 text-center py-2 text-sm">{error}</div>
      ) : (
        <div className="gallery-grid">
          {images.map((url, index) => (
            <div key={index} className="gallery-item group">
              <Image
                src={url}
                alt={`Related ${plantName} image ${index + 1}`}
                fill
                className={`gallery-image ${
                  loadedImages.has(index) ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => handleImageLoad(index)}
                onError={(e) => {
                  console.error(`Failed to load image: ${url}`);
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-plant.jpg"; // Fallback image
                }}
                unoptimized
              />
              <div className="gallery-overlay" />
              {!loadedImages.has(index) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaSpinner className="text-[#52B788] text-lg animate-spin" />
                </div>
              )}
              <button
                onClick={() => downloadImage(url)}
                className="gallery-button"
                title="Download Image"
              >
                <FaDownload size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}