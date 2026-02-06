// API service for ID Generation and Management
// Connects to local FastAPI backend at http://localhost:8000

const API_BASE_URL = 'http://localhost:8000';

export interface GeneratedIdentity {
  image_base64: string;
  audio_base64: string;
  bio: string;
  image_prompt: string;
  voice_prompt: string;
}

export interface SavedProfile {
  name: string;
  bio: string;
  image_url: string;
  audio_url: string;
}

export interface ApiError {
  detail: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: `Request failed with status ${response.status}`,
      }));
      throw new Error(error.detail);
    }

    return response.json();
  }

  async generateIdentity(description: string): Promise<GeneratedIdentity> {
    return this.request<GeneratedIdentity>('/generate_identity', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async regenerateImage(imagePrompt: string): Promise<{ image_base64: string }> {
    return this.request<{ image_base64: string }>('/regenerate_image', {
      method: 'POST',
      body: JSON.stringify({ image_prompt: imagePrompt }),
    });
  }

  async regenerateVoice(
    voicePrompt: string,
    bio: string
  ): Promise<{ audio_base64: string }> {
    return this.request<{ audio_base64: string }>('/regenerate_voice', {
      method: 'POST',
      body: JSON.stringify({ voice_prompt: voicePrompt, bio }),
    });
  }

  async saveProfile(
    name: string,
    bio: string,
    imageBase64: string,
    audioBase64: string
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/save_profile', {
      method: 'POST',
      body: JSON.stringify({
        name,
        bio,
        image_base64: imageBase64,
        audio_base64: audioBase64,
      }),
    });
  }

  async getProfiles(): Promise<SavedProfile[]> {
    return this.request<SavedProfile[]>('/profiles', {
      method: 'GET',
    });
  }
}

export const api = new ApiService();
