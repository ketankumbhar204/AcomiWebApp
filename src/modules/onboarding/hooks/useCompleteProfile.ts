import { useCallback, useState } from 'react';
import { authApi } from '@/modules/auth/api/authApi';
import { memberApi } from '@/modules/members/api/memberApi';
import { isConsumerMembershipRole } from '@/modules/onboarding/utils/profileCompletion';
import { ApiError } from '@/shared/api/errors';
import type { CompleteUserProfileRequest } from '@/shared/types/auth';
import type { MemberDocumentType } from '@/shared/types/member';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';

const MAX_DOCUMENT_FILE_URL_LENGTH = 2048;
const PENDING_UPLOAD_FILE_URL = 'pending://upload';

function resolveMemberDocumentFileUrl(fileUrl: string | null | undefined): string | null {
  const trimmed = fileUrl?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('file://') || trimmed.length > MAX_DOCUMENT_FILE_URL_LENGTH) {
    return PENDING_UPLOAD_FILE_URL;
  }
  return trimmed;
}

async function syncLinkedMemberProfile(
  spaceId: string,
  memberId: string,
  payload: CompleteUserProfileRequest,
): Promise<void> {
  const member = await memberApi.getMember(spaceId, memberId);

  await memberApi.updateMember(spaceId, memberId, {
    fullName: payload.fullName.trim(),
    mobileNumber: member.mobileNumber,
    role: member.role,
    gender: payload.gender ?? member.gender ?? null,
  });

  if (
    payload.emergencyContactName?.trim() ||
    payload.emergencyContactMobile?.trim() ||
    payload.emergencyContactRelation?.trim()
  ) {
    await memberApi.updateEmergencyContact(spaceId, memberId, {
      emergencyContactName: payload.emergencyContactName?.trim() || '',
      emergencyContactMobile: payload.emergencyContactMobile?.trim() || '',
      emergencyContactRelation: payload.emergencyContactRelation?.trim() || '',
    });
  }

  const uploads: Array<{ type: MemberDocumentType; number: string; fileUrl: string }> = [];

  const identityFileUrl = resolveMemberDocumentFileUrl(payload.identityProofFileUrl);
  if (
    payload.identityDocumentType &&
    (payload.identityDocumentNumber?.trim() || identityFileUrl)
  ) {
    uploads.push({
      type: payload.identityDocumentType as MemberDocumentType,
      number: payload.identityDocumentNumber?.trim() || 'Identity document',
      fileUrl: identityFileUrl || PENDING_UPLOAD_FILE_URL,
    });
  } else if (identityFileUrl) {
    uploads.push({
      type: 'OTHER',
      number: 'Identity proof',
      fileUrl: identityFileUrl,
    });
  }

  const addressFileUrl = resolveMemberDocumentFileUrl(payload.addressProofFileUrl);
  if (addressFileUrl) {
    uploads.push({
      type: 'OTHER',
      number: 'Address proof',
      fileUrl: addressFileUrl,
    });
  }

  const additionalFileUrl = resolveMemberDocumentFileUrl(payload.additionalDocumentFileUrl);
  if (additionalFileUrl) {
    uploads.push({
      type: 'OTHER',
      number: 'Additional document',
      fileUrl: additionalFileUrl,
    });
  }

  for (const upload of uploads) {
    await memberApi.addMemberDocument(spaceId, memberId, {
      documentType: upload.type,
      documentNumber: upload.number,
      fileUrl: upload.fileUrl,
    });
  }
}

export function useCompleteProfile() {
  const updateUser = useAuthStore((state) => state.updateUser);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeProfile = useCallback(
    async (payload: CompleteUserProfileRequest) => {
      setIsSubmitting(true);
      setError(null);

      try {
        let user;
        let usedFallback = false;
        try {
          user = await authApi.completeProfile(payload);
        } catch (err) {
          if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
            usedFallback = true;
            const baseUser = await authApi.updateMe({ fullName: payload.fullName.trim() });
            user = {
              ...baseUser,
              email: payload.email ?? baseUser.email ?? null,
              gender: payload.gender ?? baseUser.gender ?? null,
              dateOfBirth: payload.dateOfBirth ?? baseUser.dateOfBirth ?? null,
              profilePhotoUrl: payload.profilePhotoUrl ?? baseUser.profilePhotoUrl ?? null,
              permanentAddress: payload.permanentAddress,
              city: payload.city,
              state: payload.state,
              pincode: payload.pincode,
              profileCompleted: true,
              profileStatus: 'COMPLETED' as const,
              profileCompletedAt: new Date().toISOString(),
              profileCompletionPercentage: 100,
            };
          } else {
            throw err;
          }
        }

        await updateUser(user);

        if (usedFallback) {
          const consumerSpaces = mySpaces.filter((space) =>
            isConsumerMembershipRole(space.membershipRole),
          );

          for (const space of consumerSpaces) {
            try {
              const linked = await memberApi.getMyLinkedMember(space.spaceId);
              await syncLinkedMemberProfile(space.spaceId, linked.memberId, payload);
            } catch {
              // Linked member sync is best-effort on fallback path (mobile parity).
            }
          }
        }

        const refreshed = await refreshUser();
        if (refreshed?.profileCompleted !== true && user.profileCompleted) {
          await updateUser(user);
        }
        return true;
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : 'profileCompletion.errors.submitFailed',
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mySpaces, refreshUser, updateUser],
  );

  const clearError = useCallback(() => setError(null), []);

  return { completeProfile, isSubmitting, error, clearError };
}
