import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type {
  AuthTokenResponse,
  CompleteUserProfileRequest,
  SendOtpRequest,
  SendOtpResponse,
  UpdateUserRequest,
  UserResponse,
  VerifyOtpRequest,
} from '@/shared/types/auth';
import { env } from '@/shared/config/env';

const LOG_TAG = '[Acomi Auth]';

export const authApi = {
  sendOtp: async (payload: SendOtpRequest): Promise<SendOtpResponse> => {
    if (env.isDevelopment) {
      console.log(`${LOG_TAG} sendOtp →`, payload.mobileNumber);
    }
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SendOtpResponse>>('/auth/send-otp', payload),
    );
  },

  verifyOtp: async (payload: VerifyOtpRequest): Promise<AuthTokenResponse> => {
    if (env.isDevelopment) {
      console.log(`${LOG_TAG} verifyOtp → mobile:`, payload.mobileNumber);
    }
    const result = await unwrapApiResponse(
      apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/verify-otp', payload),
    );
    if (env.isDevelopment) {
      console.log(`${LOG_TAG} verifyOtp ← userId:`, result.user.id, 'name:', result.user.fullName);
    }
    return result;
  },

  getMe: async (): Promise<UserResponse> => {
    if (env.isDevelopment) {
      console.log(`${LOG_TAG} getMe →`);
    }
    return unwrapApiResponse(apiClient.get<ApiResponse<UserResponse>>('/auth/me'));
  },

  updateMe: async (payload: UpdateUserRequest): Promise<UserResponse> => {
    if (env.isDevelopment) {
      console.log(`${LOG_TAG} updateMe →`, payload);
    }
    return unwrapApiResponse(
      apiClient.patch<ApiResponse<UserResponse>>('/auth/me', payload),
    );
  },

  completeProfile: async (payload: CompleteUserProfileRequest): Promise<UserResponse> => {
    if (env.isDevelopment) {
      console.log(`${LOG_TAG} completeProfile →`, {
        ...payload,
        profilePhotoUrl: payload.profilePhotoUrl ? '[redacted]' : null,
        addressProofFileUrl: payload.addressProofFileUrl ? '[redacted]' : null,
        identityProofFileUrl: payload.identityProofFileUrl ? '[redacted]' : null,
        additionalDocumentFileUrl: payload.additionalDocumentFileUrl ? '[redacted]' : null,
      });
    }
    return unwrapApiResponse(
      apiClient.patch<ApiResponse<UserResponse>>('/auth/me/profile', {
        ...payload,
        profileCompleted: true,
        profileStatus: 'COMPLETED',
      }),
    );
  },
};
