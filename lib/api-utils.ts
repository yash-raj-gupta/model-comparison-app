import { FileAttachment } from "./file-utils";
import { AVAILABLE_MODELS } from "./models";
import { Model } from "./types";

export type MessageContent = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

// Helper function to build multimodal content with files
export function buildMultimodalContent(text: string, files: FileAttachment[]): MessageContent {
  if (files.length === 0) return text;

  const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [{ type: "text", text }];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${file.type};base64,${file.content}`,
        },
      });
    } else {
      // For non-image files, include as text with file marker
      content.push({
        type: "text",
        text: `\n\n[File: ${file.name}]\n${file.content}`,
      });
    }
  }

  return content;
}

export function getModelInfo(modelId: string): Model {
  return AVAILABLE_MODELS.find((m) => m.id === modelId) || {
    id: modelId,
    name: modelId,
    provider: "Unknown",
    color: "bg-gray-500",
  };
}
