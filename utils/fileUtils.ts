import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface FileToBlob {
  uri: string;
  name: string;
  type: string;
}

/**
 * Convert file URI to blob with platform-specific handling
 * @param fileUri - The file URI (from file picker or camera)
 * @param fileName - The name of the file
 * @param mimeType - The MIME type of the file
 * @returns Promise resolving to a Blob object
 */
export async function uriToBlob(
  fileUri: string,
  fileName: string = 'file',
  mimeType: string = 'application/octet-stream'
): Promise<Blob> {
  console.log(`📁 Converting URI to Blob on ${Platform.OS}:`, fileUri);

  try {
    // Method 1: Try direct fetch (works on web and some native scenarios)
    console.log('📥 Attempting fetch method for URI conversion...');
    const response = await fetch(fileUri);
    
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log(`✅ Successfully converted URI to blob via fetch. Size: ${blob.size} bytes`);
    return blob;

  } catch (fetchError) {
    console.warn('⚠️ Fetch method failed, trying FileSystem method...', fetchError);

    // Method 2: On native, use expo-file-system for more reliable file reading
    if (Platform.OS !== 'web') {
      try {
        console.log('📂 Reading file via expo-file-system...');
        
        // Read file as base64
        const fileData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log(`📊 File read successfully. Base64 length: ${fileData.length}`);
        
        // Convert base64 to binary string
        const binaryString = atob(fileData);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create Blob from bytes
        const blob = new Blob([bytes], { type: mimeType });
        console.log(`✅ Successfully converted URI to blob via FileSystem. Size: ${blob.size} bytes`);
        return blob;

      } catch (fsError) {
        console.error('❌ FileSystem method also failed:', fsError);
        throw new Error(`Failed to convert file URI to blob: ${fsError instanceof Error ? fsError.message : 'Unknown error'}`);
      }
    }

    throw new Error(`Failed to convert file URI to blob: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
  }
}

/**
 * Get file as base64 string (alternative method for native platforms)
 * @param fileUri - The file URI
 * @returns Promise resolving to base64 string
 */
export async function uriToBase64(fileUri: string): Promise<string> {
  console.log('📂 Reading file as base64:', fileUri);
  try {
    const base64String = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('✅ File converted to base64. Length:', base64String.length);
    return base64String;
  } catch (error) {
    console.error('❌ Failed to read file as base64:', error);
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the correct MIME type for a file
 * @param fileName - The file name with extension
 * @returns The MIME type string
 */
export function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}
