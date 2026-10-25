export type ServiceContactSort = 'updated' | 'name' | 'category';

export interface ServiceContactSpace {
  spaceId: string;
  name: string;
  type: string;
}

export interface ServiceContact {
  id: string;
  businessName: string;
  category: string;
  categoryLabel: string;
  customCategoryName?: string | null;
  contactPersonName?: string | null;
  primaryPhone?: string | null;
  alternatePhone?: string | null;
  whatsappPhone?: string | null;
  email?: string | null;
  description?: string | null;
  address?: string | null;
  notes?: string | null;
  active: boolean;
  canEdit: boolean;
  canArchive: boolean;
  spaces: ServiceContactSpace[];
  version: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ServiceContactCategoryOption {
  code: string;
  label: string;
}

export interface SaveServiceContactBody {
  businessName: string;
  category: string;
  customCategoryName?: string | null;
  contactPersonName?: string | null;
  primaryPhone?: string | null;
  alternatePhone?: string | null;
  whatsappPhone?: string | null;
  email?: string | null;
  description?: string | null;
  address?: string | null;
  notes?: string | null;
  spaceIds?: string[] | null;
  acknowledgeDuplicate?: boolean;
  version?: number | null;
}

export interface ServiceContactDuplicateMatch {
  id: string;
  businessName: string;
  category?: string;
  categoryLabel?: string;
  customCategoryName?: string | null;
  primaryPhone?: string | null;
  nameAndPhoneMatch?: boolean;
}

export interface ServiceContactDraft {
  businessName: string;
  category: string;
  customCategoryName: string;
  contactPersonName: string;
  primaryPhone: string;
  alternatePhone: string;
  whatsappPhone: string;
  email: string;
  description: string;
  address: string;
  notes: string;
  spaceIds: string[];
  version: number | null;
}
