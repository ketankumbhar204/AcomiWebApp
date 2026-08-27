export type UUID = string;

export type ProfileStatus =
  | 'PENDING'
  | 'PARTIAL'
  | 'COMPLETED'
  | 'UNDER_REVIEW'
  | 'VERIFIED';

export type KycStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export type MemberGender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED';

/** Matches backend / mobile `UserResponse`. */
export interface UserResponse {
  id: UUID;
  mobileNumber: string;
  fullName: string;
  profilePhotoUrl?: string | null;
  active: boolean;
  createdAt: string;
  email?: string | null;
  gender?: MemberGender | null;
  dateOfBirth?: string | null;
  permanentAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  profileCompleted?: boolean | null;
  profileCompletedAt?: string | null;
  profileStatus?: ProfileStatus | null;
  profileCompletionPercentage?: number | null;
  documentsUploaded?: number | null;
  kycStatus?: KycStatus | null;
}

export type OtpPurpose = 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD' | 'ACCOUNT_DELETION' | 'CHANGE_MOBILE';

export interface SendOtpRequest {
  mobileNumber: string;
  purpose: OtpPurpose;
}

export interface SendOtpResponse {
  mobileNumber: string;
  purpose: OtpPurpose;
  expiresIn: number;
  resendAfter: number;
  message: string;
}

export interface VerifyOtpRequest {
  mobileNumber: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpResponse {
  verified: boolean;
  verificationToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  mobileNumber: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
/** Optional. Required after POST /auth/verify-otp to finish registration. */
  verificationToken?: string;
}

export interface PasswordAccountDeletionRequest {
  mobileNumber: string;
  password: string;
}

export interface OtpVerifiedActionRequest {
  mobileNumber: string;
  verificationToken: string;
}

export interface ResetPasswordRequest {
  mobileNumber: string;
  verificationToken: string;
  password: string;
  confirmPassword: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  /** Milliseconds (backend `acomi.jwt.expiration-ms`). */
  expiresIn: number;
  user: UserResponse;
}

export interface UpdateUserRequest {
  fullName: string;
}

export interface CompleteUserProfileRequest {
  fullName: string;
  gender?: MemberGender | null;
  dateOfBirth?: string | null;
  email?: string | null;
  profilePhotoUrl?: string | null;
  permanentAddress: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContactName?: string | null;
  emergencyContactMobile?: string | null;
  emergencyContactRelation?: string | null;
  identityDocumentType?: string | null;
  identityDocumentNumber?: string | null;
  addressProofFileUrl?: string | null;
  identityProofFileUrl?: string | null;
  additionalDocumentFileUrl?: string | null;
  profileCompleted?: boolean;
  profileStatus?: ProfileStatus;
}

/** Port for token persistence used by Axios interceptors. */
export interface AuthTokenPort {
  getToken: () => string | null;
  setToken: (token: string | null) => void;
}

export interface AuthSessionState {
  accessToken: string | null;
  user: UserResponse | null;
  userId: UUID | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
}
