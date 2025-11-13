// Video Generation API utility for AI-powered video generation
// Supports Google Veo and other video generation APIs

export interface GenerateVideoParams {
  prompt: string;
  apiKey: string;
  duration?: number; // Duration in seconds (4-8 seconds for Veo)
  resolution?: '720p' | '1080p';
  style?: string; // Optional style reference
  apiProvider?: 'veo' | 'runway' | 'pika'; // Future: support multiple providers
}

export interface GeneratedVideo {
  videoUrl: string; // Data URL or URI to the generated video
  videoBlob?: Blob; // Optional blob if already downloaded
  thumbnailUrl?: string; // Optional thumbnail
  duration: number; // Actual duration of generated video
  prompt: string; // The prompt used
  metadata?: {
    resolution?: string;
    frameRate?: number;
    fileSize?: number;
  };
}

/**
 * Generates a video using Google Veo API (or other providers)
 * Note: Veo API may not be publicly available yet. This is a placeholder implementation.
 */
export async function generateVideo({
  prompt,
  apiKey,
  duration = 5,
  resolution = '1080p',
  style,
  apiProvider = 'veo'
}: GenerateVideoParams): Promise<GeneratedVideo> {
  try {
    // Validate duration (Veo supports 4-8 seconds)
    const validDuration = Math.max(4, Math.min(8, duration));

    if (apiProvider === 'veo') {
      return await generateVideoWithVeo({
        prompt,
        apiKey,
        duration: validDuration,
        resolution,
        style
      });
    }

    // Future: Add other providers
    throw new Error(`Video generation provider "${apiProvider}" is not yet supported.`);
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}

/**
 * Generates video using Google Veo API
 * Uses the long-running operation pattern as per Google's documentation
 */
async function generateVideoWithVeo({
  prompt,
  apiKey,
  duration,
  resolution,
  style
}: Omit<GenerateVideoParams, 'apiProvider'>): Promise<GeneratedVideo> {
  // Enhanced prompt with style and cinematographic details
  let enhancedPrompt = prompt;
  
  if (style) {
    enhancedPrompt = `${prompt}, ${style} style`;
  }

  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
  const MODEL = 'veo-3.1-generate-preview'; // Using the model from the documentation

  // Step 1: Start the long-running operation
  console.log('Starting Veo video generation...');
  const startResponse = await fetch(
    `${BASE_URL}/models/${MODEL}:predictLongRunning`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{
          prompt: enhancedPrompt
        }]
      })
    }
  );

  if (!startResponse.ok) {
    const errorData = await startResponse.json().catch(() => ({}));
    
    if (startResponse.status === 403) {
      throw new Error(
        'Access denied (403). Veo API may require:\n' +
        '1. Enabling "Generative Language API" in Google Cloud Console\n' +
        '2. Linking your billing account to the project\n' +
        '3. Requesting access to Veo (it may be in preview/beta)\n\n' +
        'Please check your Google Cloud project settings and API enablement.'
      );
    }

    if (startResponse.status === 404) {
      throw new Error(
        'Veo API endpoint not found (404). The model may not be available in your region or project. ' +
        'Please check Google AI documentation for the latest model availability.'
      );
    }

    throw new Error(
      errorData.error?.message || 
      `Veo API error: ${startResponse.status} ${startResponse.statusText}`
    );
  }

  const operationData = await startResponse.json();
  const operationName = operationData.name;

  if (!operationName) {
    throw new Error('No operation name returned from Veo API. Unexpected response format.');
  }

  console.log('Operation started:', operationName);

  // Step 2: Poll the operation status until it's done
  let isDone = false;
  let pollAttempts = 0;
  const maxPollAttempts = 120; // 10 minutes max (120 * 5 seconds)
  const pollInterval = 5000; // 5 seconds

  while (!isDone && pollAttempts < maxPollAttempts) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    pollAttempts++;

    try {
      const statusResponse = await fetch(
        `${BASE_URL}/${operationName}`,
        {
          headers: {
            'x-goog-api-key': apiKey,
          }
        }
      );

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({}));
        throw new Error(
          `Failed to check operation status: ${statusResponse.status} ${statusResponse.statusText}. ` +
          `${errorData.error?.message || ''}`
        );
      }

      const statusData = await statusResponse.json();
      isDone = statusData.done === true;

      if (isDone) {
        // Check if there's an error in the response
        if (statusData.error) {
          throw new Error(
            `Veo API operation failed: ${statusData.error.message || 'Unknown error'}`
          );
        }

        // Extract the video URI from the response
        const videoUri = statusData.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

        if (!videoUri) {
          console.error('Unexpected Veo API response format:', JSON.stringify(statusData, null, 2));
          throw new Error(
            'Video generation completed but no video URI found in response. ' +
            'Please check the console for the full response.'
          );
        }

        console.log('Video generation completed. URI:', videoUri);

        // Step 3: Download the video using the URI
        // The URI requires the API key in the header for authentication
        const videoBlob = await downloadVideoFromVeoUri(videoUri, apiKey);
        
        // Convert blob to data URL for storage
        const dataUrl = await blobToDataUrl(videoBlob);
        
        // Get video duration
        const videoDuration = await getVideoDuration(videoBlob);

        return {
          videoUrl: dataUrl, // Data URL ready for use
          videoBlob: videoBlob, // Also return the blob for direct use
          thumbnailUrl: undefined, // Veo API doesn't seem to provide thumbnails in this response
          duration: videoDuration,
          prompt: enhancedPrompt,
          metadata: {
            resolution: resolution,
            frameRate: 24, // Default, Veo may specify this
            fileSize: videoBlob.size
          }
        };
      }

      // Log progress every 30 seconds
      if (pollAttempts % 6 === 0) {
        console.log(`Still generating... (${pollAttempts * 5} seconds elapsed)`);
      }
    } catch (pollError: any) {
      // If it's a network error during polling, we might want to retry
      if (pollError.message?.includes('Failed to fetch')) {
        console.warn('Network error during polling, will retry...');
        continue;
      }
      throw pollError;
    }
  }

  if (!isDone) {
    throw new Error(
      `Video generation timed out after ${maxPollAttempts * pollInterval / 1000} seconds. ` +
      'The operation may still be processing. Please check the operation status manually.'
    );
  }

  throw new Error('Unexpected end of polling loop');
}

/**
 * Downloads video from Veo URI with API key authentication
 */
async function downloadVideoFromVeoUri(uri: string, apiKey: string): Promise<Blob> {
  const response = await fetch(uri, {
    headers: {
      'x-goog-api-key': apiKey,
    },
    redirect: 'follow' // Follow redirects
  });

  if (!response.ok) {
    throw new Error(`Failed to download video from URI: ${response.status} ${response.statusText}`);
  }

  return await response.blob();
}

/**
 * Converts a Blob to a data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads a video from a URL and converts it to a blob/data URL
 * This is useful for storing generated videos in the project
 */
export async function downloadVideoAsDataUrl(videoUrl: string): Promise<{ dataUrl: string; blob: Blob }> {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          dataUrl: reader.result as string,
          blob
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
}

/**
 * Gets video duration from a video URL or blob
 */
export async function getVideoDuration(videoUrl: string | Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    if (typeof videoUrl === 'string') {
      video.src = videoUrl;
    } else {
      video.src = URL.createObjectURL(videoUrl);
    }
  });
}

