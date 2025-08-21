import { AxiosResponse } from "axios";
import APIClient from "./api-client";
import { AudioAnalysisResponse } from "@/types/Recording";

// The type expected for the audio file (RN/Expo style)
export interface AudioFile {
  uri: string;
  type: string; // e.g., "audio/mpeg", "audio/wav"
  name: string;
}

const apiClient = new APIClient<AudioFile>('/audio');

export const analyzeAudio = async (
  audioFile: AudioFile
): Promise<AudioAnalysisResponse> => {
  try {
    const formData = new FormData();
    formData.append("audio", {
      uri: audioFile.uri,
      type: audioFile.type,
      name: audioFile.name,
    } as any); // `as any` because React Native FormData expects this shape

    const response: AxiosResponse<AudioAnalysisResponse> = await apiClient.post(
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("API Error:", error.response?.data || error.message);
    throw error;
  }
};
// export const analyzeAudio = async (audioFile: AudioFile): Promise<AudioAnalysisResponse> => {
//   try {
//     const formData = new FormData();
//     formData.append('audio', audioFile as any); // `as any` to bypass TypeScript strictness for React Native FormData

//     const response: AxiosResponse<AudioAnalysisResponse> = await apiClient.post(formData);
//     return response.data;
//   } catch (error: any) {
//     console.error('Audio Service Error:', error.response?.data || error.message);
//     throw error;
//   }
// };

export default apiClient;