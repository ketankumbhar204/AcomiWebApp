/** Route path constants and builders. */
export const ROUTES = {
  root: '/',
  notFound: '/404',
  login: '/login',
  register: '/register',
  registerOtp: '/register/otp',
  loginOtp: '/login/otp',
  forgotPassword: '/forgot-password',
  forgotPasswordOtp: '/forgot-password/otp',
  resetPassword: '/reset-password',
  deleteAccountOtp: '/delete-account/otp',
  changeMobile: '/change-mobile',
  changeMobileOtp: '/change-mobile/otp',
  registerPassword: '/register/password',
  otp: '/otp',
  unauthorized: '/unauthorized',
  forbidden: '/forbidden',
  privacy: '/privacy',
  deleteAccount: '/delete-account',
  noSpaces: '/no-spaces',
  onboarding: '/onboarding',
  createSpace: '/create-space',
  joinSpace: '/join-space',
  acceptInvitations: '/accept-invitations',
  mySpaces: '/my-spaces',
  completeProfile: '/complete-profile',
  profile: '/profile',
  globalAttention: '/global/attention',
  globalActivity: '/global/activity',
  globalMembers: '/global/members',
  globalMeals: '/global/meals',
  globalPayments: '/global/payments',
  globalComplaints: '/global/complaints',
  globalNotices: '/global/notices',
  globalReports: '/global/reports',
  spaces: '/spaces',
  adminLogin: '/admin/login',
  adminDashboard: '/admin',
  adminProperties: '/admin/properties',
  adminAddProperty: '/admin/properties/new',
  adminMess: '/admin/mess',
  adminAddMess: '/admin/mess/new',
  adminRegisteredUsers: '/admin/registered-users',
  adminSavedAddresses: '/admin/saved-addresses',
} as const;

export function spaceDashboardPath(spaceId: string): string {
  return `/spaces/${spaceId}/dashboard`;
}

export function spaceDetailsPath(spaceId: string): string {
  return `/spaces/${spaceId}/details`;
}

export function spaceEditPath(spaceId: string): string {
  return `/spaces/${spaceId}/edit`;
}

export function spacePendingActionsPath(spaceId: string): string {
  return `/spaces/${spaceId}/pending-actions`;
}

export function spaceNotificationsPath(spaceId: string): string {
  return `/spaces/${spaceId}/notifications`;
}

export function spaceOccupancyListPath(
  spaceId: string,
  mode: 'active' | 'moveInsThisMonth' = 'active',
): string {
  return `/spaces/${spaceId}/occupancy?mode=${mode}`;
}

export function spaceBedInventoryPath(spaceId: string, status = 'AVAILABLE'): string {
  return `/spaces/${spaceId}/bed-inventory?status=${encodeURIComponent(status)}`;
}

export function spaceSpaceHealthPath(spaceId: string): string {
  return `/spaces/${spaceId}/space-health`;
}

export function spaceMealHeadcountPath(
  spaceId: string,
  params?: { date?: string; mealType?: string },
): string {
  const search = new URLSearchParams();
  if (params?.date) search.set('date', params.date);
  if (params?.mealType) search.set('mealType', params.mealType);
  const qs = search.toString();
  return qs
    ? `/spaces/${spaceId}/meal-headcount?${qs}`
    : `/spaces/${spaceId}/meal-headcount`;
}

export function spaceMembersPath(spaceId: string): string {
  return `/spaces/${spaceId}/members`;
}

export function spaceImportPeoplePath(spaceId: string): string {
  return `/spaces/${spaceId}/members/import`;
}

export function spaceAddCustomersHubPath(spaceId: string): string {
  return `/spaces/${spaceId}/members/add-hub`;
}

export function spaceMemberPath(spaceId: string, memberId: string): string {
  return `/spaces/${spaceId}/members/${memberId}`;
}

export function spaceAccommodationPath(spaceId: string): string {
  return `/spaces/${spaceId}/accommodation`;
}

export function spaceAccommodationQuickSetupPath(spaceId: string): string {
  return `/spaces/${spaceId}/accommodation/quick-setup`;
}

export function spaceOccupancyWizardPath(
  spaceId: string,
  mode:
    | 'ALLOCATE'
    | 'RESERVE'
    | 'MOVE_IN'
    | 'TRANSFER'
    | 'VACATE' = 'ALLOCATE',
  params?: {
    memberId?: string;
    bedId?: string;
    roomId?: string;
    unitId?: string;
    buildingId?: string;
    occupancyId?: string;
    /** Absolute or app path to return to after cancel/success (e.g. bed inventory). */
    returnTo?: string;
  },
): string {
  const search = new URLSearchParams({ mode });
  if (params?.memberId) search.set('memberId', params.memberId);
  if (params?.bedId) search.set('bedId', params.bedId);
  if (params?.roomId) search.set('roomId', params.roomId);
  if (params?.unitId) search.set('unitId', params.unitId);
  if (params?.buildingId) search.set('buildingId', params.buildingId);
  if (params?.occupancyId) search.set('occupancyId', params.occupancyId);
  if (params?.returnTo) search.set('returnTo', params.returnTo);
  return `/spaces/${spaceId}/occupancy/wizard?${search.toString()}`;
}

export function spaceMealsPath(spaceId: string, date?: string): string {
  const base = `/spaces/${spaceId}/meals`;
  return date ? `${base}?date=${encodeURIComponent(date)}` : base;
}

/** Full-page menu planner editor (no sidebar chrome). */
export function spaceMealsEditPath(
  spaceId: string,
  params: { date: string; mealType: string },
): string {
  const search = new URLSearchParams({
    date: params.date,
    mealType: params.mealType,
  });
  return `/spaces/${spaceId}/meals/edit?${search.toString()}`;
}

export function spaceMealsLibraryPath(spaceId: string): string {
  return `/spaces/${spaceId}/meals/library`;
}

export function spaceMealsLocationsPath(spaceId: string): string {
  return `/spaces/${spaceId}/meals/locations`;
}

export function spaceMealsParticipationPath(spaceId: string): string {
  return `/spaces/${spaceId}/meals/participation`;
}

export function spaceMealsSharePath(spaceId: string, date?: string): string {
  const base = `/spaces/${spaceId}/meals/share`;
  return date ? `${base}?date=${encodeURIComponent(date)}` : base;
}

export function spaceMealsPollPath(
  spaceId: string,
  date?: string,
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER',
): string {
  const base = `/spaces/${spaceId}/meals/poll`;
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (mealType) params.set('meal', mealType);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function spaceMealsPlansPath(spaceId: string, tab?: 'plans' | 'requests'): string {
  const base = `/spaces/${spaceId}/meals/plans`;
  return tab && tab !== 'plans' ? `${base}?tab=${tab}` : base;
}

export function spaceMealsPlansCustomerPath(spaceId: string): string {
  return `/spaces/${spaceId}/meals/plans/customer`;
}

export function spaceDayMealsPath(spaceId: string): string {
  return `/spaces/${spaceId}/payments/day-meals`;
}

export function spacePaymentsPath(
  spaceId: string,
  paymentId?: string,
  params?: {
    month?: string;
    tab?: string;
    memberId?: string;
  },
): string {
  const base = paymentId
    ? `/spaces/${spaceId}/payments/${paymentId}`
    : `/spaces/${spaceId}/payments`;
  const search = new URLSearchParams();
  if (params?.month) search.set('month', params.month);
  if (params?.tab) search.set('tab', params.tab);
  if (params?.memberId) search.set('memberId', params.memberId);
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export function spaceComplaintsPath(
  spaceId: string,
  complaintId?: string,
  params?: {
    status?: string;
    priority?: string;
    category?: string;
    mine?: boolean;
  },
): string {
  const base = complaintId
    ? `/spaces/${spaceId}/complaints/${complaintId}`
    : `/spaces/${spaceId}/complaints`;
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.priority) search.set('priority', params.priority);
  if (params?.category) search.set('category', params.category);
  if (params?.mine) search.set('mine', 'true');
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export function spaceInventoryPath(
  spaceId: string,
  itemId?: string,
  params?: {
    tab?: string;
    stock?: string;
    categoryId?: string;
  },
): string {
  const base = itemId
    ? `/spaces/${spaceId}/inventory/items/${itemId}`
    : `/spaces/${spaceId}/inventory`;
  const search = new URLSearchParams();
  if (params?.tab) search.set('tab', params.tab);
  if (params?.stock) search.set('stock', params.stock);
  if (params?.categoryId) search.set('categoryId', params.categoryId);
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export function adminPropertyDetailPath(id: string): string {
  return `/admin/properties/${id}`;
}

export function adminPropertiesPath(params?: {
  tab?: 'leads' | 'active';
  source?: 'PUBLIC_WEBSITE' | 'ADMIN';
}): string {
  const search = new URLSearchParams();
  if (params?.tab) search.set('tab', params.tab);
  if (params?.source) search.set('source', params.source);
  const qs = search.toString();
  return qs ? `${ROUTES.adminProperties}?${qs}` : ROUTES.adminProperties;
}

export function adminAddPropertyPath(): string {
  return ROUTES.adminAddProperty;
}

export function adminMessDetailPath(id: string): string {
  return `/admin/mess/${id}`;
}

export function adminMessPath(params?: {
  tab?: 'leads' | 'active';
  source?: 'PUBLIC_WEBSITE' | 'ADMIN';
}): string {
  const search = new URLSearchParams();
  if (params?.tab) search.set('tab', params.tab);
  if (params?.source) search.set('source', params.source);
  const qs = search.toString();
  return qs ? `${ROUTES.adminMess}?${qs}` : ROUTES.adminMess;
}

export function adminAddMessPath(): string {
  return ROUTES.adminAddMess;
}

export type AppRoutePath = (typeof ROUTES)[keyof typeof ROUTES];
