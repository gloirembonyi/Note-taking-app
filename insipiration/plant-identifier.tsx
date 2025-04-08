"use client";

import Link from "next/link";
//import PlantC from '../../components/PlantC';
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  FaArrowRight,
  FaCamera,
  FaUpload,
  FaLeaf,
  FaSeedling,
  FaCloudSun,
  FaWater,
  FaSearch,
  FaGlobe,
  FaTimes,
} from "react-icons/fa";
import PlantChat from "./plantChat";
import RelatedImages from "./RelatedImages";
import { motion, AnimatePresence } from "framer-motion";

// Update the cleanPlantResponse function
const cleanPlantResponse = (text: string) => {
  return (
    text
      // Remove all special characters and markdown
      .replace(/[\*\#\`\[\]]/g, "")
      // Clean up dots and asterisks at start of lines
      .replace(/^[\.\*\s]+/gm, "")
      // Fix bullet points
      .replace(/^[-•]/gm, "•")
      // Clean up the status line
      .replace(/Status:\s*/, "Status: ")
      // Format section headers
      .replace(
        /^(PLANT INFORMATION|CHARACTERISTICS|CARE REQUIREMENTS|GROWING INFORMATION|HEALTH ASSESSMENT)$/gm,
        (match) => `\n${match}\n${Array(match.length + 1).join("═")}`
      )
      // Clean up extra spaces
      .replace(/\s+:/g, ":")
      // Format the content
      .split("\n")
      .map((line) => {
        line = line.trim();
        // Format key-value pairs
        if (line.includes(":")) {
          const [key, ...value] = line.split(":");
          return `${key.trim()}: ${value.join(":").trim()}`;
        }
        // Format bullet points
        if (line.startsWith("•")) {
          return `  ${line}`;
        }
        return line;
      })
      .filter((line) => line)
      .join("\n")
  );
};

export default function PlantIdentifier() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    plantInfo: string;
    healthAssessment: string;
  } | null>(null);
  const [translatedResult, setTranslatedResult] = useState<{
    plantInfo: string;
    healthAssessment: string;
  } | null>(null);
  const [showTranslateOptions, setShowTranslateOptions] = useState(false);
  const [showAllTopIssues, setShowAllTopIssues] = useState(false);
  const [showAllDetectedIssues, setShowAllDetectedIssues] = useState(false);
  const translateMenuRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diseasesIssues, setDiseasesIssues] = useState<{
    [key: string]: { count: number; lastUpdated: number };
  }>({});
  const [showIdentificationResults, setShowIdentificationResults] =
    useState(false);
  const [animate, setAnimate] = useState(false);
  const [identifiedPlant, setIdentifiedPlant] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{
    hasError: boolean;
    message: string;
    suggestion: string;
  }>({
    hasError: false,
    message: "",
    suggestion: "",
  });
  const [isUsingPreCheckAPI, setIsUsingPreCheckAPI] = useState(true);

  useEffect(() => {
    const savedDiseasesIssues = localStorage.getItem("diseasesIssues");
    if (savedDiseasesIssues) {
      setDiseasesIssues(JSON.parse(savedDiseasesIssues));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("diseasesIssues", JSON.stringify(diseasesIssues));
  }, [diseasesIssues]);

  // Reset error state when a new image is uploaded or captured
  useEffect(() => {
    if (image) {
      setErrorState({
        hasError: false,
        message: "",
        suggestion: "",
      });
    }
  }, [image]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target && e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Reset error state
      setErrorState({
        hasError: false,
        message: "",
        suggestion: "",
      });

      // Check file size (max 4MB)
      if (file.size > 4 * 1024 * 1024) {
        setErrorState({
          hasError: true,
          message: "Image size must be less than 4MB",
          suggestion: "Please compress your image or choose a smaller one.",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        setErrorState({
          hasError: true,
          message: "Invalid file type",
          suggestion: "Please upload an image file (JPG, PNG, etc.).",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setImage(event.target.result);
        }
      };
      reader.onerror = () => {
        setErrorState({
          hasError: true,
          message: "Error reading file",
          suggestion:
            "There was a problem processing your image. Please try another one.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // For the camera capture function
  const handleCameraCapture = () => {
    // Reset error state
    setErrorState({
      hasError: false,
      message: "",
      suggestion: "",
    });

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then(function (stream) {
          const videoElement = document.createElement("video");
          videoElement.srcObject = stream;
          videoElement.setAttribute("playsinline", "true");
          videoElement.style.position = "fixed";
          videoElement.style.top = "0";
          videoElement.style.left = "0";
          videoElement.style.width = "100%";
          videoElement.style.height = "100%";
          videoElement.style.objectFit = "cover";
          videoElement.style.zIndex = "9999";

          // Add a cancel button
          const cancelButton = document.createElement("button");
          cancelButton.textContent = "Cancel";
          cancelButton.style.position = "fixed";
          cancelButton.style.top = "20px";
          cancelButton.style.right = "20px";
          cancelButton.style.zIndex = "10000";
          cancelButton.style.padding = "10px 20px";
          cancelButton.style.backgroundColor = "#f44336";
          cancelButton.style.color = "white";
          cancelButton.style.border = "none";
          cancelButton.style.borderRadius = "5px";
          cancelButton.style.cursor = "pointer";

          const captureButton = document.createElement("button");
          captureButton.textContent = "Capture";
          captureButton.style.position = "fixed";
          captureButton.style.bottom = "20px";
          captureButton.style.left = "50%";
          captureButton.style.transform = "translateX(-50%)";
          captureButton.style.zIndex = "10000";
          captureButton.style.padding = "10px 20px";
          captureButton.style.backgroundColor = "#52B788";
          captureButton.style.color = "white";
          captureButton.style.border = "none";
          captureButton.style.borderRadius = "5px";
          captureButton.style.cursor = "pointer";

          document.body.appendChild(videoElement);
          document.body.appendChild(captureButton);
          document.body.appendChild(cancelButton);

          videoElement.play();

          const cleanupCamera = () => {
            stream.getTracks().forEach((track) => track.stop());
            document.body.removeChild(videoElement);
            document.body.removeChild(captureButton);
            document.body.removeChild(cancelButton);
          };

          cancelButton.onclick = () => {
            cleanupCamera();
          };

          captureButton.onclick = () => {
            const canvas = document.createElement("canvas");
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const context = canvas.getContext("2d");

            if (!context) {
              setErrorState({
                hasError: true,
                message: "Failed to capture image",
                suggestion:
                  "Your browser might not support this feature. Try uploading an image instead.",
              });
              cleanupCamera();
              return;
            }

            context.drawImage(videoElement, 0, 0);
            const imageDataUrl = canvas.toDataURL("image/jpeg");

            // Ensure imageDataUrl is a string
            if (typeof imageDataUrl === "string") {
              setImage(imageDataUrl);
            } else {
              setErrorState({
                hasError: true,
                message: "Failed to capture image",
                suggestion: "Please try again or upload an image manually.",
              });
            }

            // Clean up
            cleanupCamera();
          };
        })
        .catch(function (error) {
          console.error("Camera error: ", error);
          setErrorState({
            hasError: true,
            message: "Camera access denied or not available",
            suggestion:
              "Please allow camera access or upload an image instead.",
          });
        });
    } else {
      setErrorState({
        hasError: true,
        message: "Camera not supported",
        suggestion:
          "Your device or browser doesn't support camera access. Please upload an image instead.",
      });
    }
  };

  // Pre-check if the image contains a plant with improved detection
  const validateImageContainsPlant = async () => {
    if (!image) return false;

    try {
      const genAI = new GoogleGenerativeAI(
        process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || ""
      );

      const imageData = {
        mimeType: "image/jpeg",
        data: image.split(",")[1],
      };

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 150,
        },
      });

      const preCheckPrompt = `
Analyze this image and respond with ONE of these exact categories:
- "PLANT: CLEAR" - If this is clearly a plant (natural, living plant - not artificial)
- "PLANT: UNCLEAR" - If this might be a plant but the image is blurry/unclear
- "NOT_PLANT: ARTIFICIAL" - If this appears to be an artificial/fake plant
- "NOT_PLANT: OBJECT" - If this is an object, person, animal, or anything not plant-related
- "NOT_PLANT: FOOD" - If this is processed food or prepared dish
- "NOT_PLANT: DRAWING" - If this is a drawing, illustration, or computer-generated image

ONLY respond with one of these exact categories, no explanation needed.
`;

      const result = await model.generateContent([
        { text: preCheckPrompt },
        { inlineData: imageData },
      ]);

      const response = await result.response;
      const text = response.text().trim().toUpperCase();

      console.log("Plant pre-check result:", text);

      if (text.includes("PLANT: CLEAR")) {
        return true;
      } else if (text.includes("PLANT: UNCLEAR")) {
        // Uncertain but we'll allow it with a warning
        setErrorState({
          hasError: true,
          message: "Image is unclear, but we'll try to identify the plant",
          suggestion:
            "Results may be less accurate. Consider uploading a clearer image for better identification.",
        });
        // Don't return false here - we still want to attempt identification
        return true;
      } else if (text.includes("NOT_PLANT: ARTIFICIAL")) {
        setErrorState({
          hasError: true,
          message: "This appears to be an artificial or fake plant",
          suggestion:
            "Please upload an image of a real, living plant for accurate identification.",
        });
        return false;
      } else if (text.includes("NOT_PLANT: FOOD")) {
        setErrorState({
          hasError: true,
          message: "This appears to be prepared food, not a living plant",
          suggestion:
            "For plant identification, please upload an image of a growing plant, not processed food.",
        });
        return false;
      } else if (text.includes("NOT_PLANT: DRAWING")) {
        setErrorState({
          hasError: true,
          message: "This appears to be a drawing or illustration",
          suggestion:
            "Please upload a photograph of a real plant, not artwork or illustrations.",
        });
        return false;
      } else if (text.includes("NOT_PLANT")) {
        setErrorState({
          hasError: true,
          message: "No plant detected in this image",
          suggestion:
            "Please upload a clear photograph of a plant for identification.",
        });
        return false;
      } else {
        // Fallback for unexpected responses
        console.warn(
          "Unexpected plant detection response, proceeding with analysis"
        );
        return true;
      }
    } catch (error) {
      console.error("Error pre-checking image:", error);
      // Log error but allow identification to continue as fallback
      return true;
    }
  };

  const identifyPlant = async () => {
    if (!image) return;
    setLoading(true);

    // Reset error state
    setErrorState({
      hasError: false,
      message: "",
      suggestion: "",
    });

    try {
      // First validate if the image contains a plant
      const isPlant = await validateImageContainsPlant();
      if (!isPlant) {
        setLoading(false);
        return;
      }

      // Quick quality check for the image
      const imageQuality = await checkImageQuality();
      if (imageQuality.needsWarning) {
        // Just set a warning, don't prevent identification
        setErrorState({
          hasError: true,
          message: imageQuality.message,
          suggestion: imageQuality.suggestion,
        });
      }

      const genAI = new GoogleGenerativeAI(
        process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || ""
      );

      // Create a proper image part object
      const imageData = {
        mimeType: "image/jpeg",
        data: image.split(",")[1],
      };

      // Update model to gemini-1.5-flash with optimized parameters
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
      });

      // Enhanced prompt with improved guidance for handling non-plant images
      const prompt = `
Analyze this plant image thoroughly and provide detailed identification and care information.

FIRST, verify this is a clear image of a real plant. If it's not a plant or is too unclear to identify, respond with ONLY:
NOT_A_PLANT: This doesn't appear to be a clear image of a real plant. Please provide a clearer image showing the plant's features.

If it IS a plant but you cannot identify the exact species with confidence, provide your best educated guess and note your uncertainty.

For properly identified plants, provide this information in the following format:

PLANT INFORMATION
Common Name: [primary common name and any alternative names]
Scientific Name: [genus and species with proper formatting]
Family: [botanical family name]

CHARACTERISTICS
• Growth Rate: [speed - slow/moderate/fast and approximate timeframe if known]
• Mature Size: [height and spread dimensions with both imperial and metric]
• Life Cycle: [annual/biennial/perennial/etc. with explanation]
• Native Region: [geographical origins of the plant]

CARE REQUIREMENTS
• Light Needs: [detailed requirements including intensity, hours, and any seasonal variations]
• Water Needs: [specific frequency, amount, and seasonal adjustments]
• Soil Type: [detailed soil composition, pH preferences, drainage requirements]
• Temperature: [optimal range, tolerance limits, and any cold hardiness information]
• Humidity: [preferred humidity levels and any special requirements]
• Fertilization: [type, frequency, and seasonal adjustments]

HEALTH ASSESSMENT
Status: [detailed assessment of current condition - healthy/stressed/diseased with confidence level]

Observations:
• [detailed observation about overall appearance]
• [detailed observation about leaf condition, color, and any visible issues]
• [detailed observation about stem/growth pattern]
• [detailed observation about any visible pests, diseases, or deficiencies]
• [detailed observation about flowering/fruiting if applicable]

Care Recommendations:
• [specific, actionable recommendation for immediate care]
• [specific recommendation for improving current health issues if present]
• [specific recommendation for optimal growth]
• [specific recommendation for preventing common issues]
• [specific recommendation for seasonal care relevant to current season]

Important:
• [critical care information that shouldn't be overlooked]
• [information about toxicity to humans or pets if applicable]
• [warning about invasiveness or other concerns if applicable]
• [special propagation or maintenance tips]

Be extremely detailed, accurate, and prioritize practical advice for plant care. If the image quality is poor, note how it affects your confidence in the identification.
`;

      // Generate content with proper structure
      const result = await model.generateContent([
        {
          text: prompt,
        },
        {
          inlineData: imageData,
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Check if the response indicates this is not a plant
      if (text.includes("NOT_A_PLANT:")) {
        throw new Error(
          "The uploaded image does not appear to contain a plant"
        );
      }

      // Check if the model couldn't identify the plant
      if (
        text.includes("I cannot identify") ||
        text.includes("unable to identify") ||
        text.includes("cannot determine") ||
        text.includes("not clear enough") ||
        text.includes("cannot provide a confident identification")
      ) {
        throw new Error(
          "Unable to identify the plant in this image. Please provide a clearer image that shows the plant's distinctive features."
        );
      }

      // The rest of the existing processing code
      const [plantInfo, healthAssessment] = text.split(/HEALTH ASSESSMENT/i);

      const cleanedPlantInfo = cleanPlantResponse(plantInfo)
        .replace(/^([A-Z\s]+)$/gm, "\n$1") // Add spacing around main headers
        .replace(/^([A-Z][^:]+):$/gm, "\n$1:"); // Add spacing around subheaders

      // Process health assessment to remove nested duplications
      let processedHealthAssessment = healthAssessment;
      
      // Remove any duplicated "Care Recommendations:" sections that might appear within Observations
      const observationsCareRecMatch = processedHealthAssessment.match(/Observations:[\s\S]*?(•\s*Care Recommendations:[\s\S]*?)(\n\nCare Recommendations:)/i);
      if (observationsCareRecMatch) {
        processedHealthAssessment = processedHealthAssessment.replace(observationsCareRecMatch[1], '');
      }
      
      // Remove any duplicated "Important:" sections that might appear within Observations or Care Recommendations
      const nestedImportantMatch = processedHealthAssessment.match(/(Observations:|Care Recommendations:)[\s\S]*?(•\s*Important:[\s\S]*?)(\n\nImportant:)/i);
      if (nestedImportantMatch) {
        processedHealthAssessment = processedHealthAssessment.replace(nestedImportantMatch[2], '');
      }

      const cleanedHealthAssessment = cleanPlantResponse(processedHealthAssessment)
        .replace(/^Status:/m, "\nStatus:")
        .replace(/^(Observations|Care Recommendations|Important):$/gm, "\n$1:");

      setResult({
        plantInfo: cleanedPlantInfo,
        healthAssessment:
          "HEALTH ASSESSMENT\n═════════════════\n" + cleanedHealthAssessment,
      });

      setTranslatedResult({
        plantInfo: cleanedPlantInfo,
        healthAssessment:
          "HEALTH ASSESSMENT\n═════════════════\n" + cleanedHealthAssessment,
      });

      // Process diseases/issues with improved pattern matching
      const healthAssessmentSection = text.split(/HEALTH ASSESSMENT/i)[1] || "";
      let issues: string[] = [];

      // Look for explicit disease mentions in Observations and Care Recommendations
      const observationsMatch = healthAssessmentSection.match(
        /Observations:[\s\S]*?(Care Recommendations|Important):/i
      );
      const recommendationsMatch = healthAssessmentSection.match(
        /Care Recommendations:[\s\S]*?(Important|$)/i
      );

      if (observationsMatch && observationsMatch[0]) {
        // Extract problems from bullet points in Observations
        const observations = observationsMatch[0];
        const bulletPoints = observations.match(/•[^•]*/g) || [];

        bulletPoints.forEach((point) => {
          // Look for negative health indicators
          if (
            /yellow|brown|wilt|drooping|spot|disease|pest|rot|damage|dying|stress|deficien|burn|chlor|infected/i.test(
              point
            )
          ) {
            const issue = point.replace(/^•\s*/, "").trim();
            if (issue) issues.push(issue);
          }
        });
      }

      if (issues.length > 0) {
        const currentTime = Date.now();
        setDiseasesIssues((prevIssues) => {
          const newIssues = { ...prevIssues };
          issues.forEach((issue) => {
            // Extract a concise version of the issue (first 50 chars)
            const conciseIssue = issue.substring(0, 50).trim();
            if (conciseIssue in newIssues) {
              newIssues[conciseIssue] = {
                count: newIssues[conciseIssue].count + 1,
                lastUpdated: currentTime,
              };
            } else {
              newIssues[conciseIssue] = { count: 1, lastUpdated: currentTime };
            }
          });
          return newIssues;
        });
      }

      setShowIdentificationResults(true);
      setAnimate(true);

      // Extract plant name more robustly
      const commonNameMatch = cleanedPlantInfo.match(/Common Name:\s*([^\n]+)/);
      const scientificNameMatch = cleanedPlantInfo.match(
        /Scientific Name:\s*([^\n]+)/
      );

      const plantName =
        commonNameMatch?.[1]?.trim() ||
        scientificNameMatch?.[1]?.trim() ||
        "Unknown Plant";

      setIdentifiedPlant(plantName);
    } catch (error) {
      console.error("Error identifying plant:", error);

      let errorMessage = error instanceof Error ? error.message : String(error);
      let suggestion = "Please try again with a clearer image of a plant.";

      if (
        errorMessage.includes("not a plant") ||
        errorMessage.includes("NOT_A_PLANT")
      ) {
        errorMessage = "The uploaded image does not appear to contain a plant.";
        suggestion = "Please upload a clear image of a real plant.";
      } else if (
        errorMessage.includes("unable to identify") ||
        errorMessage.includes("cannot identify")
      ) {
        errorMessage = "Unable to identify the plant in this image.";
        suggestion =
          "Try uploading a clearer image showing more of the plant's distinctive features.";
      } else if (
        errorMessage.includes("quota exceeded") ||
        errorMessage.includes("rate limit")
      ) {
        errorMessage = "Service temporarily unavailable.";
        suggestion = "Please try again in a few minutes.";
      }

      setErrorState({
        hasError: true,
        message: errorMessage,
        suggestion: suggestion,
      });

      setResult({
        plantInfo: `Error: ${errorMessage}`,
        healthAssessment: "",
      });

      setTranslatedResult({
        plantInfo: `Error: ${errorMessage}`,
        healthAssessment: "",
      });

      // Don't show identification results for errors
      setShowIdentificationResults(false);
    } finally {
      setLoading(false);
    }
  };

  // Add a new function to check image quality
  const checkImageQuality = async (): Promise<{
    needsWarning: boolean;
    message: string;
    suggestion: string;
  }> => {
    if (!image) return { needsWarning: false, message: "", suggestion: "" };

    try {
      // Create an image element to analyze the image
      const img = document.createElement("img");
      img.src = image;

      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Check dimensions - too small images are problematic
      if (img.width < 300 || img.height < 300) {
        return {
          needsWarning: true,
          message: "Image resolution is very low",
          suggestion:
            "For better identification, use images that are at least 300x300 pixels.",
        };
      }

      // Check aspect ratio - extremely wide or tall images may be problematic
      const aspectRatio = img.width / img.height;
      if (aspectRatio > 3 || aspectRatio < 0.33) {
        return {
          needsWarning: true,
          message: "Image has an unusual shape",
          suggestion:
            "For better results, use an image where the plant is centered and fills most of the frame.",
        };
      }

      // More advanced checks could be added here in the future

      return { needsWarning: false, message: "", suggestion: "" };
    } catch (error) {
      console.error("Error checking image quality:", error);
      return { needsWarning: false, message: "", suggestion: "" };
    }
  };

  const closeIdentificationResults = () => {
    setAnimate(false);
    setTimeout(() => {
      setShowIdentificationResults(false);
      setResult(null);
      setTranslatedResult(null);
      setImage(null);
    }, 300);
  };
  //
  const getTopFiveIssues = () => {
    return Object.entries(diseasesIssues)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([issue, data], index) => ({
        name: issue,
        percentage: (
          (data.count /
            Object.values(diseasesIssues).reduce((a, b) => a + b.count, 0)) *
          100
        ).toFixed(0),
        rank: index + 1,
      }));
  };
  // Update the state types

  // Modify the translateResult function to handle all content properly
  const translateResult = async (lang: string) => {
    if (!result) return;
    setLoading(true);

    try {
      // Separating content to ensure everything gets translated
      const plantInfoContent = result.plantInfo;
      const healthAssessmentContent = result.healthAssessment;

      // Create clearer separation markers for better reliability
      const combinedContent = `===PLANT_INFO_START===
${plantInfoContent}
===PLANT_INFO_END===
===HEALTH_ASSESSMENT_START===
${healthAssessmentContent}
===HEALTH_ASSESSMENT_END===`;

      console.log("Sending content for translation:", {
        targetLanguage: lang,
        contentLength: combinedContent.length,
      });

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: combinedContent,
          targetLanguage: lang,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `Translation failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Translation response received", {
        success: !!data.translatedText,
        responseLength: data.translatedText?.length || 0,
      });

      if (data.error) {
        throw new Error(`Translation error: ${data.error}`);
      }

      // Extract the translated sections based on markers
      const translatedText = data.translatedText || "";

      // Extract plant info section with more robust pattern matching
      const plantInfoMatch = translatedText.match(
        /===PLANT_INFO_START===\s*([\s\S]*?)\s*===PLANT_INFO_END===/
      );

      // Extract health assessment section with more robust pattern matching
      const healthAssessmentMatch = translatedText.match(
        /===HEALTH_ASSESSMENT_START===\s*([\s\S]*?)\s*===HEALTH_ASSESSMENT_END===/
      );

      // Ensure we have valid content and do additional processing
      let translatedPlantInfo = result.plantInfo;
      let translatedHealthAssessment = result.healthAssessment;

      if (plantInfoMatch && plantInfoMatch[1] && plantInfoMatch[1].trim()) {
        translatedPlantInfo = plantInfoMatch[1].trim();

        // Make sure section headers are properly formatted
        translatedPlantInfo = translatedPlantInfo
          .replace(/^(PLANT INFORMATION)/gm, "\n$1")
          .replace(/^(CHARACTERISTICS)/gm, "\n$1")
          .replace(/^(CARE REQUIREMENTS)/gm, "\n$1");
      }

      if (
        healthAssessmentMatch &&
        healthAssessmentMatch[1] &&
        healthAssessmentMatch[1].trim()
      ) {
        translatedHealthAssessment = healthAssessmentMatch[1].trim();

        // Make sure health assessment sections are properly formatted
        if (!translatedHealthAssessment.startsWith("HEALTH ASSESSMENT")) {
          translatedHealthAssessment =
            "HEALTH ASSESSMENT\n═════════════════\n" +
            translatedHealthAssessment;
        }

        // Ensure key sections are properly formatted
        translatedHealthAssessment = translatedHealthAssessment
          .replace(/^Observations:?$/gm, "\nObservations:")
          .replace(/^Care Recommendations:?$/gm, "\nCare Recommendations:")
          .replace(/^Important:?$/gm, "\nImportant:");
      }

      console.log("Successfully extracted translated content", {
        hasPlantInfo: !!plantInfoMatch,
        hasHealthAssessment: !!healthAssessmentMatch,
        plantInfoLength: translatedPlantInfo.length,
        healthAssessmentLength: translatedHealthAssessment.length,
      });

      // Update the translated result
      setTranslatedResult({
        plantInfo: translatedPlantInfo,
        healthAssessment: translatedHealthAssessment,
      });
    } catch (error) {
      console.error("Translation error:", error);
      // If translation fails, revert to original content
      setTranslatedResult(result);
      setErrorState({
        hasError: true,
        message: "Translation failed",
        suggestion: "Please try again or select a different language.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Replace the toggleTranslateOptions function with enhanced version
  const toggleTranslateOptions = () => {
    setShowTranslateOptions(!showTranslateOptions);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        translateMenuRef.current &&
        !translateMenuRef.current.contains(event.target as Node)
      ) {
        setShowTranslateOptions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#050414] via-[#1a0f2e] to-[#2a1b3d] text-white font-['Roboto'] relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="diamond-particles opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050414] via-transparent to-transparent"></div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 relative z-10">
        <motion.div
          className="flex-grow lg:mr-0 space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className=" rounded-3xl  pl-6 backdrop-blur-md border-l border-[#52B788]/20 hover:border-l-[#52B788]/40 transition-all duration-500">
            <motion.div
              className={`flex ${
                showIdentificationResults ? "justify-between" : "justify-center"
              } items-center mb-8`}
              variants={itemVariants}
            >
              <div className="relative">
                <h2
                  className={`text-5xl bg-gradient-to-r from-[#52B788] to-[#1FBA9C] bg-clip-text text-transparent font-light ${
                    showIdentificationResults ? "" : "text-center"
                  }`}
                >
                  Plant Identifier
                  <motion.span
                    className="absolute -top-4 -right-12 text-sm bg-[#52B788] px-2 py-1 rounded-full text-white transform rotate-12"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <span className="mr-1">✦</span> ELITE
                  </motion.span>
                </h2>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="title-particles"></div>
                </div>
              </div>
              {showIdentificationResults && (
                <div className="flex space-x-4">
                  <div className="relative" ref={translateMenuRef}>
                    <button
                      onClick={toggleTranslateOptions}
                      className="bg-[#1a0f2e]/60 hover:bg-[#1a0f2e] text-[#52B788] py-1.5 px-3 rounded-lg transition-all duration-300 text-sm flex items-center"
                      disabled={loading}
                    >
                      <FaGlobe className="mr-2 text-xs" />
                      {loading ? "Translating..." : "Translate"}
                    </button>
                    {showTranslateOptions && (
                      <div className="absolute right-0 top-full mt-2 bg-[#081C15] border border-[#52B788] rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                        {[
                          { code: "en", name: "English" },
                          { code: "fr", name: "French" },
                          { code: "es", name: "Spanish" },
                          { code: "de", name: "German" },
                          { code: "it", name: "Italian" },
                          { code: "pt", name: "Portuguese" },
                          { code: "ru", name: "Russian" },
                          { code: "ja", name: "Japanese" },
                          { code: "zh", name: "Chinese" },
                          { code: "ar", name: "Arabic" },
                          { code: "hi", name: "Hindi" },
                          { code: "sw", name: "Swahili" },
                          { code: "rw", name: "Kinyarwanda" },
                        ].map((language) => (
                          <button
                            key={language.code}
                            onClick={() => {
                              translateResult(language.code);
                              setShowTranslateOptions(false);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-[#1B4332] transition disabled:opacity-50 disabled:cursor-not-allowed font-thin"
                            disabled={loading}
                          >
                            {language.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={closeIdentificationResults}
                    className="bg-[#f44336]/90 hover:bg-[#f44336] text-white py-1.5 px-3 rounded-lg transition-all duration-300 text-sm flex items-center"
                  >
                    <FaTimes className="mr-2 text-xs" /> Close
                  </button>
                </div>
              )}
            </motion.div>

            {/* Error message display */}
            {errorState.hasError && (
              <motion.div
                className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start">
                  <div className="bg-red-500/20 p-2 rounded-full mr-3">
                    <FaTimes className="text-red-500" size={20} />
                  </div>
                  <div>
                    <h3 className="text-red-400 font-medium text-lg mb-1">
                      {errorState.message}
                    </h3>
                    <p className="text-white/80">{errorState.suggestion}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Image Upload and Capture Section */}
            {!showIdentificationResults && (
              <motion.div
                className="transition-all duration-500 ease-in-out space-y-6"
                variants={itemVariants}
              >
                <div className="flex justify-center space-x-4 mb-6">
                  <motion.label
                    className="group bg-gradient-to-r from-[#52B788] to-[#1FBA9C] text-white px-6 py-3 rounded-full cursor-pointer hover:shadow-lg hover:shadow-[#52B788]/20 transition-all duration-300 flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaUpload className="mr-3 group-hover:rotate-12 transition-transform" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </motion.label>
                  <motion.button
                    onClick={handleCameraCapture}
                    className="group bg-gradient-to-r from-[#52B788] to-[#1FBA9C] text-white px-6 py-3 rounded-full hover:shadow-lg hover:shadow-[#52B788]/20 transition-all duration-300 flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaCamera className="mr-3 group-hover:rotate-12 transition-transform" />
                    Take Photo
                  </motion.button>
                </div>

                {/* Stats Bar */}
                <motion.div
                  className="grid grid-cols-4 gap-4 bg-[#0a0520]/60 p-5 rounded-2xl backdrop-blur-md border border-[#52B788]/20"
                  variants={itemVariants}
                >
                  <div className="text-center">
                    <FaLeaf className="w-6 h-6 text-[#52B788] mx-auto mb-2" />
                    <div className="text-2xl font-light text-white mb-1">
                      1.2K+
                    </div>
                    <div className="text-sm text-gray-400">
                      Plants Identified
                    </div>
                  </div>
                  <div className="text-center">
                    <FaSeedling className="w-6 h-6 text-[#52B788] mx-auto mb-2" />
                    <div className="text-2xl font-light text-white mb-1">
                      98%
                    </div>
                    <div className="text-sm text-gray-400">Accuracy Rate</div>
                  </div>
                  <div className="text-center">
                    <FaCloudSun className="w-6 h-6 text-[#52B788] mx-auto mb-2" />
                    <div className="text-2xl font-light text-white mb-1">
                      24/7
                    </div>
                    <div className="text-sm text-gray-400">Availability</div>
                  </div>
                  <div className="text-center">
                    <FaWater className="w-6 h-6 text-[#52B788] mx-auto mb-2" />
                    <div className="text-2xl font-light text-white mb-1">
                      500+
                    </div>
                    <div className="text-sm text-gray-400">Care Guides</div>
                  </div>
                </motion.div>

                {/* Uploaded Image Preview */}
                {image && (
                  <motion.div
                    className="flex flex-col items-center space-y-4"
                    variants={itemVariants}
                  >
                    <div className="relative group">
                      <Image
                        src={image}
                        alt="Uploaded plant"
                        width={400}
                        height={400}
                        className="rounded-2xl shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 rounded-2xl overflow-hidden">
                        <div className="shine-effect"></div>
                      </div>
                    </div>
                    <motion.button
                      onClick={identifyPlant}
                      className="relative bg-gradient-to-r from-[#52B788] to-[#1FBA9C] text-white px-8 py-4 rounded-full hover:shadow-lg hover:shadow-[#52B788]/20 transition-all duration-300 flex items-center space-x-3 overflow-hidden group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={loading || !image}
                    >
                      <span className="relative z-10 flex items-center">
                        {loading ? (
                          <>
                            <span className="animate-spin mr-3">⌛</span>
                            Analyzing Plant...
                          </>
                        ) : (
                          <>
                            Identify Plant
                            <FaArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="button-shine-effect"></div>
                      </div>
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Identification Results */}
            {showIdentificationResults && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className=" overflow-hidden"
                >
                  {/* Layout with image at the top */}
                  <div className=" pt-0">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                      {/* Image preview at the left */}
                      {image && (
                        <div className="md:w-1/3 flex-shrink-0">
                          <div className="premium-card relative p-0 overflow-hidden group">
                            <div className="aspect-square rounded-xl overflow-hidden">
                              <img
                                src={image}
                                alt="Plant"
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/40 to-transparent"></div>
                              <div className="shine-effect"></div>
                            </div>
                            <div className="absolute bottom-3 left-3 bg-[#0a0520]/80 px-3 py-1 rounded-full border border-[#52B788]/30 text-xs text-[#52B788]">
                              ANALYZED IMAGE
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Related images at the right */}
                      {identifiedPlant && (
                        <div className="md:w-2/3 flex-grow">
                          <div className="premium-card h-full">
                            <h3 className="premium-gradient-text text-lg font-light mb-3 flex items-center">
                              <FaSearch className="mr-2 text-sm" /> Related
                              Images
                              <span className="text-xs py-0.5 px-1.5 bg-[#52B788]/20 rounded-full text-[#52B788] text-[10px] ml-2">
                                GALLERY
                              </span>
                            </h3>
                            <div className="h-[180px] overflow-hidden">
                              <RelatedImages plantName={identifiedPlant} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Results grid with reduced spacing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Parse plant information */}
                      {translatedResult && (
                        <>
                          {/* Plant Information Section */}
                          <div className="premium-card h-full">
                            <h3 className="premium-gradient-text text-lg font-light mb-3">
                              Plant Information
                            </h3>
                            <div className="space-y-2 custom-scrollbar overflow-y-auto max-h-[60vh]">
                              {/* Extract and display common name */}
                              {(() => {
                                const commonNameMatch =
                                  translatedResult.plantInfo.match(
                                    /Common Name:\s*([^\n]+)/
                                  );
                                const commonName = commonNameMatch
                                  ? commonNameMatch[1]
                                  : "";
                                return (
                                  <div className="flex items-start gap-3 group p-2 hover:bg-[#52B788]/5 rounded-lg transition-all">
                                    <div className="font-medium text-[#52B788] whitespace-nowrap">
                                      Common Name:
                                    </div>
                                    <div className="text-white/90 group-hover:text-white transition-colors">
                                      {commonName}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Extract and display scientific name */}
                              {(() => {
                                const scientificNameMatch =
                                  translatedResult.plantInfo.match(
                                    /Scientific Name:\s*([^\n]+)/
                                  );
                                const scientificName = scientificNameMatch
                                  ? scientificNameMatch[1]
                                  : "";
                                return (
                                  <div className="flex items-start gap-3 group p-2 hover:bg-[#52B788]/5 rounded-lg transition-all">
                                    <div className="font-medium text-[#52B788] whitespace-nowrap">
                                      Scientific Name:
                                    </div>
                                    <div className="text-white/90 italic group-hover:text-white transition-colors">
                                      {scientificName}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Extract and display family */}
                              {(() => {
                                const familyMatch =
                                  translatedResult.plantInfo.match(
                                    /Family:\s*([^\n]+)/
                                  );
                                const family = familyMatch
                                  ? familyMatch[1]
                                  : "";
                                return (
                                  <div className="flex items-start gap-3 group p-2 hover:bg-[#52B788]/5 rounded-lg transition-all">
                                    <div className="font-medium text-[#52B788] whitespace-nowrap">
                                      Family:
                                    </div>
                                    <div className="text-white/90 group-hover:text-white transition-colors">
                                      {family}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Characteristics Section */}
                              <div className="mt-4 border-t border-[#52B788]/10 pt-3">
                                <h4 className="text-base font-light text-[#52B788] mb-2">
                                  Characteristics
                                </h4>

                                {/* Extract and display characteristics */}
                                {(() => {
                                  const characteristicsSection =
                                    translatedResult.plantInfo.match(
                                      /CHARACTERISTICS\n[═-]+\n([\s\S]*?)(?=\n\n|\n[A-Z]+\s?[A-Z]+)/
                                    );
                                  const characteristics = characteristicsSection
                                    ? characteristicsSection[1].trim()
                                    : "";

                                  // Extract bullet points
                                  const bulletPoints = characteristics
                                    .split("\n")
                                    .filter((line) => line.trim());

                                  return (
                                    <div className="space-y-1">
                                      {bulletPoints.map((point, index) => {
                                        // Extract label and value if it's a colon-separated line
                                        const [label, value] = point
                                          .split(":")
                                          .map((p) => p.trim());

                                        return value ? (
                                          <div
                                            key={index}
                                            className="flex items-start gap-3 group p-2 hover:bg-[#52B788]/5 rounded-lg transition-all"
                                          >
                                            <div className="font-medium text-[#52B788] whitespace-nowrap">
                                              {label}:
                                            </div>
                                            <div className="text-white/90 group-hover:text-white transition-colors">
                                              {value}
                                            </div>
                                          </div>
                                        ) : (
                                          <div
                                            key={index}
                                            className="pl-4 text-white/90 hover:text-white transition-colors"
                                          >
                                            {point.startsWith("•")
                                              ? point
                                              : `• ${point}`}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Care Requirements Section */}
                              <div className="mt-4 border-t border-[#52B788]/10 pt-3">
                                <h4 className="text-base font-light text-[#52B788] mb-2">
                                  Care Requirements
                                </h4>

                                {/* Extract and display care requirements */}
                                {(() => {
                                  // More thorough pattern to extract care requirements section
                                  const careSection =
                                    translatedResult.plantInfo.match(
                                      /CARE REQUIREMENTS\n[═-]+\n([\s\S]*?)(?=\n\n[A-Z]+\s?[A-Z]+|$)/
                                    );
                                  const care = careSection
                                    ? careSection[1].trim()
                                    : "";

                                  // Extract bullet points
                                  const carePoints = care
                                    .split("\n")
                                    .filter((line) => line.trim());

                                  return (
                                    <div className="space-y-1">
                                      {carePoints.length > 0 ? (
                                        carePoints.map((point, index) => {
                                          // Extract label and value if it's a colon-separated line
                                          const [label, value] = point
                                            .split(":")
                                            .map((p) => p.trim());

                                          return value ? (
                                            <div
                                              key={index}
                                              className="flex items-start gap-3 group p-2 hover:bg-[#52B788]/5 rounded-lg transition-all"
                                            >
                                              <div className="font-medium text-[#52B788] whitespace-nowrap">
                                                {label}:
                                              </div>
                                              <div className="text-white/90 group-hover:text-white transition-colors">
                                                {value}
                                              </div>
                                            </div>
                                          ) : (
                                            <div
                                              key={index}
                                              className="pl-4 text-white/90 hover:text-white transition-colors"
                                            >
                                              {point.startsWith("•")
                                                ? point
                                                : `• ${point}`}
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <div className="text-white/70 italic">
                                          No specific care requirements provided
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Health Assessment Section */}
                          <div className="premium-card h-full">
                            <h3 className="premium-gradient-text text-lg font-light mb-3">
                              Health Assessment
                            </h3>
                            <div className="space-y-2 custom-scrollbar overflow-y-auto max-h-[60vh]">
                              {/* Extract and display status */}
                              {(() => {
                                const statusMatch =
                                  translatedResult.healthAssessment.match(
                                    /Status:\s*([^\n]+)/
                                  );
                                const status = statusMatch
                                  ? statusMatch[1].trim()
                                  : "";
                                const isHealthy = status
                                  .toLowerCase()
                                  .includes("healthy");

                                return (
                                  <div className="mb-4 flex justify-center">
                                    <div
                                      className={`py-2 px-4 rounded-full text-white text-center inline-flex items-center ${
                                        isHealthy
                                          ? "bg-[#4CAF50]/80"
                                          : "bg-[#FFC107]/80"
                                      } hover:shadow-lg hover:scale-105 transition-all duration-300`}
                                    >
                                      <span
                                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                          isHealthy
                                            ? "bg-[#4CAF50] animate-pulse"
                                            : "bg-[#FFC107] animate-pulse"
                                        }`}
                                      ></span>
                                      <span className="font-medium">
                                        {status}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Extract and display observations */}
                              <div className="mt-2">
                                <h4 className="text-base font-light text-[#52B788] mb-2">
                                  Observations
                                </h4>

                                {(() => {
                                  // Improved extraction pattern for observations - exclude nested Care Recommendations and Important
                                  const observationsMatch =
                                    translatedResult.healthAssessment.match(
                                      /\nObservations:?\s*\n([\s\S]*?)(?=\n\s*\n\s*Care Recommendations:|\n\s*\n\s*Important:|\n\n[A-Z]+\s?[A-Z]+|$)/
                                    );
                                  let observations = observationsMatch
                                    ? observationsMatch[1].trim()
                                    : "";
                                    
                                  // Remove any nested Care Recommendations or Important sections
                                  observations = observations
                                    .replace(/•\s*Care Recommendations:[\s\S]*?(?=\n•|\n\n|$)/gi, '')
                                    .replace(/•\s*Important:[\s\S]*?(?=\n•|\n\n|$)/gi, '');

                                  // Split into bullet points
                                  const bulletPoints = observations
                                    .split("\n")
                                    .map((line) => line.trim())
                                    .filter((line) => line && 
                                       !line.toLowerCase().includes('care recommendations:') && 
                                       !line.toLowerCase().includes('important:'));

                                  return (
                                    <ul className="space-y-1">
                                      {bulletPoints.length > 0 ? (
                                        bulletPoints.map((point, index) => (
                                          <li
                                            key={index}
                                            className="flex items-start space-x-2 px-2 py-1.5 hover:bg-[#52B788]/5 rounded-lg transition-all group"
                                          >
                                            <span className="text-[#52B788] mt-1 text-base transform group-hover:scale-125 transition-transform">
                                              •
                                            </span>
                                            <span className="text-white/90 leading-relaxed group-hover:text-white transition-colors">
                                              {point.startsWith("•")
                                                ? point.substring(1).trim()
                                                : point}
                                            </span>
                                          </li>
                                        ))
                                      ) : (
                                        <li className="text-white/70 italic">
                                          No specific observations provided
                                        </li>
                                      )}
                                    </ul>
                                  );
                                })()}
                              </div>

                              {/* Extract and display care recommendations */}
                              <div className="mt-4 border-t border-[#52B788]/10 pt-3">
                                <h4 className="text-base font-light text-[#52B788] mb-2">
                                  Care Recommendations
                                </h4>

                                {(() => {
                                  // Improved extraction pattern for care recommendations - find the dedicated section only
                                  const recommendationsMatch =
                                    translatedResult.healthAssessment.match(
                                      /\n\s*Care Recommendations:?\s*\n([\s\S]*?)(?=\n\s*\n\s*Important:|\n\n[A-Z]+\s?[A-Z]+|$)/
                                    );
                                  let recommendations = recommendationsMatch
                                    ? recommendationsMatch[1].trim()
                                    : "";
                                    
                                  // Remove any nested Important sections
                                  recommendations = recommendations
                                    .replace(/•\s*Important:[\s\S]*?(?=\n•|\n\n|$)/gi, '');

                                  // Split into bullet points
                                  const bulletPoints = recommendations
                                    .split("\n")
                                    .map((line) => line.trim())
                                    .filter((line) => line && !line.toLowerCase().includes('important:'));

                                  return (
                                    <ul className="space-y-1">
                                      {bulletPoints.length > 0 ? (
                                        bulletPoints.map((point, index) => (
                                          <li
                                            key={index}
                                            className="flex items-start space-x-2 px-2 py-1.5 hover:bg-[#52B788]/5 rounded-lg transition-all group"
                                          >
                                            <span className="text-[#52B788] mt-1 text-base transform group-hover:scale-125 transition-transform">
                                              •
                                            </span>
                                            <span className="text-white/90 leading-relaxed group-hover:text-white transition-colors">
                                              {point.startsWith("•")
                                                ? point.substring(1).trim()
                                                : point}
                                            </span>
                                          </li>
                                        ))
                                      ) : (
                                        <li className="text-white/70 italic">
                                          No specific recommendations provided
                                        </li>
                                      )}
                                    </ul>
                                  );
                                })()}
                              </div>

                              {/* Important section if present */}
                              {(() => {
                                const importantMatch =
                                  translatedResult.healthAssessment.match(
                                    /\n\s*Important:?\s*\n([\s\S]*?)(?=\n\n[A-Z]+\s?[A-Z]+|$)/
                                  );

                                if (
                                  importantMatch &&
                                  importantMatch[1].trim()
                                ) {
                                  const importantPoints = importantMatch[1]
                                    .trim()
                                    .split("\n")
                                    .map((line) => line.trim())
                                    .filter((line) => line);

                                  return (
                                    <div className="mt-4 border-t border-[#52B788]/10 pt-3">
                                      <h4 className="text-base font-light text-[#52B788] mb-2">
                                        Important
                                      </h4>
                                      <ul className="space-y-1">
                                        {importantPoints.map((point, index) => (
                                          <li
                                            key={index}
                                            className="flex items-start space-x-2 px-2 py-1.5 hover:bg-[#52B788]/5 rounded-lg transition-all group"
                                          >
                                            <span className="text-[#52B788] mt-1 text-base transform group-hover:scale-125 transition-transform">
                                              •
                                            </span>
                                            <span className="text-white/90 leading-relaxed group-hover:text-white transition-colors">
                                              {point.startsWith("•")
                                                ? point.substring(1).trim()
                                                : point}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          <div className="relative h-64 mb-8 rounded-2xl overflow-hidden">
            <Image
              src="/tropical-sunset.jpg" // Add this image to your public folder
              alt="Tropical Sunset"
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050414] to-transparent"></div>
            <h2 className="absolute bottom-6 left-6 text-4xl text-white font-thin z-10 neon-text">
              Discover Nature's Secrets
            </h2>
          </div>
          {/* AI Explanation Section */}
          <div className="transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg hover:shadow-[#ff00ff]/20">
            <h3 className="text-2xl font-thin text-[#52B788] mb-4">
              How Our AI Works
            </h3>
            <p className="text-white font-thin mb-4">
              Our plant identification AI uses advanced machine learning
              algorithms to analyze images of plants and provide accurate
              information about their species, health, and care requirements.
            </p>
            <ol className="list-decimal list-inside text-[dad7cd] transition font-thin space-y-2">
              <li>Upload or take a photo of a plant</li>
              <li>
                Our AI analyzes the image, considering factors like leaf shape,
                color, and texture
              </li>
              <li>
                The AI compares the image to its vast database of plant species
              </li>
              <li>
                It provides detailed information about the plant, including its
                name and care instructions
              </li>
              <li>
                The AI also assesses the plant's health and offers suggestions
                for improvement if needed
              </li>
            </ol>
          </div>
          {/* Plant Expert Section */}
          <motion.div
            className="relative rounded-3xl overflow-hidden"
            variants={itemVariants}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0520]/90 to-[#1a0f2e]/90 backdrop-blur-md z-0"></div>
            <div className="relative z-10 p-8">
              <motion.div
                className="flex items-center mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="mr-6">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-[#52B788] to-[#1FBA9C] flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <FaLeaf className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
                <div>
                  <h3 className="text-3xl font-light text-transparent bg-gradient-to-r from-[#52B788] to-[#1FBA9C] bg-clip-text mb-2">
                    Plant Expert AI
                  </h3>
                  <p className="text-white/80 font-light text-lg">
                    Advanced machine learning for precise plant identification
                    and care guidance
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                variants={containerVariants}
              >
                <motion.div
                  className="bg-[#1a0f2e]/50 rounded-2xl p-6 hover:bg-[#1a0f2e]/70 transition-all duration-300 group"
                  variants={itemVariants}
                >
                  <h4 className="text-xl font-light text-[#52B788] mb-4 flex items-center">
                    <FaSeedling className="mr-3 group-hover:rotate-12 transition-transform" />
                    Identification Process
                  </h4>
                  <ul className="space-y-3">
                    <motion.li
                      className="flex items-start space-x-3 text-white/80 font-light group-hover:text-white transition-colors"
                      variants={itemVariants}
                    >
                      <span className="text-[#52B788]">01.</span>
                      <span>Upload or capture a photo of your plant</span>
                    </motion.li>
                    <motion.li
                      className="flex items-start space-x-3 text-white/80 font-light group-hover:text-white transition-colors"
                      variants={itemVariants}
                    >
                      <span className="text-[#52B788]">02.</span>
                      <span>AI analyzes leaf shape, color, and texture</span>
                    </motion.li>
                    <motion.li
                      className="flex items-start space-x-3 text-white/80 font-light group-hover:text-white transition-colors"
                      variants={itemVariants}
                    >
                      <span className="text-[#52B788]">03.</span>
                      <span>Compare with extensive plant database</span>
                    </motion.li>
                  </ul>
                </motion.div>

                <motion.div
                  className="bg-[#1a0f2e]/50 rounded-2xl p-6 hover:bg-[#1a0f2e]/70 transition-all duration-300 group"
                  variants={itemVariants}
                >
                  <h4 className="text-xl font-light text-[#52B788] mb-4 flex items-center">
                    <FaWater className="mr-3 group-hover:rotate-12 transition-transform" />
                    Care Guidance
                  </h4>
                  <ul className="space-y-3">
                    <motion.li
                      className="flex items-start space-x-3 text-white/80 font-light group-hover:text-white transition-colors"
                      variants={itemVariants}
                    >
                      <span className="text-[#52B788]">01.</span>
                      <span>Detailed plant care instructions</span>
                    </motion.li>
                    <motion.li
                      className="flex items-start space-x-3 text-white/80 font-light group-hover:text-white transition-colors"
                      variants={itemVariants}
                    >
                      <span className="text-[#52B788]">02.</span>
                      <span>Health assessment and monitoring</span>
                    </motion.li>
                    <motion.li
                      className="flex items-start space-x-3 text-white/80 font-light group-hover:text-white transition-colors"
                      variants={itemVariants}
                    >
                      <span className="text-[#52B788]">03.</span>
                      <span>Personalized growth recommendations</span>
                    </motion.li>
                  </ul>
                </motion.div>
              </motion.div>

              <motion.div
                className="mt-6 flex justify-center"
                variants={itemVariants}
              >
                <div className="inline-flex items-center space-x-2 text-[#52B788] group cursor-pointer">
                  <span className="font-light">
                    Learn more about our technology
                  </span>
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column - Sidebar */}
        <motion.aside
          className="lg:w-[calc(2/6*100%)] space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {showIdentificationResults && image && (
            <motion.div
              className="bg-[#130a2a]/60 rounded-3xl shadow-2xl p-8 backdrop-blur-md border border-[#52B788]/20 hover:border-[#52B788]/40 transition-all duration-500"
              variants={itemVariants}
            >
              <div className="relative group">
                <Image
                  src={image}
                  alt="Identified plant"
                  width={300}
                  height={300}
                  className="rounded-2xl shadow-2xl mb-6 mx-auto transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="shine-effect"></div>
                </div>
              </div>
              <div className="flex justify-center space-x-3">
                <motion.button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      if (target && target.files && target.files.length > 0) {
                        const file = target.files[0];
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          if (e.target && typeof e.target.result === "string") {
                            setImage(e.target.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  className="bg-gradient-to-r from-[#52B788] to-[#1FBA9C] text-white px-4 py-2 rounded-full hover:shadow-lg hover:shadow-[#52B788]/20 transition-all duration-300 flex items-center space-x-2 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaUpload className="group-hover:rotate-12 transition-transform" />
                  <span>New</span>
                </motion.button>
                <motion.button
                  onClick={handleCameraCapture}
                  className="bg-gradient-to-r from-[#52B788] to-[#1FBA9C] text-white px-4 py-2 rounded-full hover:shadow-lg hover:shadow-[#52B788]/20 transition-all duration-300 flex items-center space-x-2 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaCamera className="group-hover:rotate-12 transition-transform" />
                  <span>Photo</span>
                </motion.button>
                <motion.button
                  onClick={identifyPlant}
                  className="bg-gradient-to-r from-[#52B788] to-[#1FBA9C] text-white px-4 py-2 rounded-full hover:shadow-lg hover:shadow-[#52B788]/20 transition-all duration-300 flex items-center space-x-2 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="animate-spin">⌛</span>
                  ) : (
                    <>
                      <span>ID</span>
                      <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {showIdentificationResults && image && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <PlantChat
                imageContext={image}
                plantInfo={`${result?.plantInfo || ""}\n\n${
                  result?.healthAssessment || ""
                }`}
              />
            </motion.div>
          )}

          <motion.div
            className="bg-[#130a2a]/80 rounded-3xl shadow-2xl p-8 backdrop-blur-md border border-[#52B788]/20 hover:border-[#52B788]/40 transition-all duration-500"
            variants={itemVariants}
          >
            <h3 className="text-2xl font-light text-transparent bg-gradient-to-r from-[#52B788] to-[#1FBA9C] bg-clip-text mb-6">
              Top Plant Issues
            </h3>
            <div className="space-y-4">
              {getTopFiveIssues().map((issue, index) => (
                <motion.div
                  key={index}
                  className="bg-[#1a0f2e]/50 rounded-2xl p-4 hover:bg-[#1a0f2e]/70 transition-all duration-300 group"
                  variants={itemVariants}
                  custom={index}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-[#52B788] font-light">
                        {issue.rank}
                      </div>
                      <div className="text-white font-light group-hover:text-[#52B788] transition-colors">
                        {issue.name}
                      </div>
                    </div>
                    <div className="text-[#52B788] font-light">
                      {issue.percentage}%
                    </div>
                  </div>
                  <div className="mt-2 bg-[#52B788]/20 rounded-full h-1 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#52B788] to-[#1FBA9C]"
                      initial={{ width: 0 }}
                      animate={{ width: `${issue.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.button
              onClick={() => setShowAllTopIssues(!showAllTopIssues)}
              className="mt-6 w-full bg-gradient-to-r from-[#52B788] to-[#1FBA9C] text-white px-6 py-3 rounded-full hover:shadow-lg hover:shadow-[#52B788]/20 transition-all duration-300 font-light"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showAllTopIssues ? "Show Less" : "Show All Issues"}
            </motion.button>
          </motion.div>

          <motion.div
            className="bg-[#130a2a]/80 rounded-3xl shadow-2xl p-8 backdrop-blur-md border border-[#52B788]/20 hover:border-[#52B788]/40 transition-all duration-500"
            variants={itemVariants}
          >
            <h3 className="text-2xl font-light text-transparent bg-gradient-to-r from-[#52B788] to-[#1FBA9C] bg-clip-text mb-6">
              Recently Detected Issues
            </h3>
            <div className="space-y-4">
              {(() => {
                const issueMap = new Map<string, number>();
                return Object.entries(diseasesIssues)
                  .sort(([, a], [, b]) => b.lastUpdated - a.lastUpdated)
                  .reduce(
                    (
                      acc: [string, { count: number; lastUpdated: number }][],
                      [issue, data]
                    ) => {
                      if (issueMap.has(issue)) {
                        const count = issueMap.get(issue)! + 1;
                        issueMap.set(issue, count);
                        acc.push([`${issue} (${count})`, data]);
                      } else {
                        issueMap.set(issue, 1);
                        acc.push([issue, data]);
                      }
                      return acc;
                    },
                    []
                  )
                  .slice(0, showAllDetectedIssues ? undefined : 5)
                  .map(([issue, data], index) => (
                    <motion.div
                      key={index}
                      className="bg-[#1a0f2e]/50 rounded-2xl p-4 hover:bg-[#1a0f2e]/70 transition-all duration-300 group"
                      variants={itemVariants}
                      custom={index}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-white font-light group-hover:text-[#52B788] transition-colors">
                          {issue}
                        </div>
                        <div className="text-[#52B788] font-light">
                          {new Date(data.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    </motion.div>
                  ));
              })()}
            </div>
            <motion.button
              onClick={() => setShowAllDetectedIssues(!showAllDetectedIssues)}
              className="mt-6 w-full bg-gradient-to-r from-[#52B788] to-[#1FBA9C] text-white px-6 py-3 rounded-full hover:shadow-lg hover:shadow-[#52B788]/20 transition-all duration-300 font-light"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showAllDetectedIssues ? "Show Less" : "Show All Issues"}
            </motion.button>
          </motion.div>
        </motion.aside>
      </main>

      {/* Footer */}
      <footer className="bg-[#0a0520]/80 text-[#ff00ff] py-12 backdrop-blur-sm border-t border-[#ff00ff]/20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-thin mb-2">About Plant Identifier</h3>
              <p className="font-thin">
                Our AI-powered plant identification tool helps you discover and
                learn about various plant species quickly and accurately.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-thin mb-2">Quick Links</h3>
              <ul className="space-y-2 font-thin">
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors duration-300"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors duration-300"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors duration-300"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-thin mb-2">Contact Us</h3>
              <p className="font-thin">Email: info@plantidentifier.com</p>
              <p className="font-thin">Phone: (123) 456-7890</p>
            </div>
          </div>
          <div className="mt-7 text-center">
            <p className="font-thin">
              &copy; 2024 Plant Identifier. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}