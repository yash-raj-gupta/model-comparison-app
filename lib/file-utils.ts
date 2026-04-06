export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // base64 encoded content
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILES = 5;

export const ALLOWED_FILE_TYPES = [
  // Documents
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Code files (treated as text)
  'text/javascript',
  'text/typescript',
  'text/html',
  'text/css',
  'text/x-python',
  'application/json',
  'application/xml',
  // Images (for vision models)
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
];

export const ALLOWED_EXTENSIONS = [
  '.txt', '.md', '.markdown', '.pdf', '.doc', '.docx',
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css',
  '.py', '.json', '.xml', '.yaml', '.yml',
  '.c', '.cpp', '.h', '.hpp', '.java', '.go', '.rs', '.rb', '.php', '.swift',
  '.png', '.jpg', '.jpeg', '.webp', '.gif',
];

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File "${file.name}" exceeds 5MB limit` };
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isAllowedType = ALLOWED_FILE_TYPES.includes(file.type);
  const isAllowedExtension = ALLOWED_EXTENSIONS.includes(extension);

  if (!isAllowedType && !isAllowedExtension) {
    return {
      valid: false,
      error: `File type not supported: ${file.name}. Supported: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function processFiles(files: File[]): Promise<{ attachments: FileAttachment[]; errors: string[] }> {
  const attachments: FileAttachment[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      errors.push(validation.error!);
      continue;
    }

    try {
      const base64Content = await fileToBase64(file);
      attachments.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type || 'text/plain',
        size: file.size,
        content: base64Content,
      });
    } catch {
      errors.push(`Failed to process file: ${file.name}`);
    }
  }

  return { attachments, errors };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageFile(type: string): boolean {
  return type.startsWith('image/');
}

export function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return 'image';
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('word') || type.includes('document')) return 'document';
  if (type.includes('json') || type.includes('javascript') || type.includes('typescript')) return 'code';
  return 'text';
}
