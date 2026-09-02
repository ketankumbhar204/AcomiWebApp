import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthLayoutOutlet } from './AuthLayoutOutlet';
import { GuestRoute, ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from '@/modules/admin/components/AdminRoute';
import { SpaceBootstrapOutlet } from '@/modules/dashboard/layouts/SpaceBootstrapOutlet';
import { SpaceShellLayout } from '@/modules/dashboard/layouts/SpaceShellLayout';
import { GlobalShellLayout } from '@/layouts/GlobalShellLayout';
import { AccommodationPermissionGate } from '@/modules/accommodation/components/AccommodationPermissionGate';
import { MealsPermissionGate } from '@/modules/meals/components/MealsPermissionGate';
import { PaymentsPermissionGate } from '@/modules/payments/components/PaymentsPermissionGate';
import { ComplaintsPermissionGate } from '@/modules/complaints/components/ComplaintsPermissionGate';
import { InventoryPermissionGate } from '@/modules/inventory/components/InventoryPermissionGate';
import { MembersPermissionGate } from '@/modules/members/components/MembersPermissionGate';
import { ProfileCompletionGate } from '@/modules/onboarding/components/ProfileCompletionGate';
import { AuthenticatedRootRedirect } from '@/modules/onboarding/components/AuthenticatedRootRedirect';
import { LoadingState } from '@/shared/components/LoadingState';
import { RouteErrorPage } from '@/shared/components/RouteErrorPage';
import { ROUTES } from '@/routes/paths';

/** Lazy import with one retry — recovers from stale Vite HMR chunk failures. */
function lazyPage<T extends ComponentType<object>>(loader: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await loader();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(
          message,
        )
      ) {
        await new Promise((r) => setTimeout(r, 150));
        return loader();
      }
      throw error;
    }
  });
}

function RouteFallback() {
  return <LoadingState minHeight={240} label="Loading" />;
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

function L({ children }: { children: ReactNode }) {
  return <Lazy>{children}</Lazy>;
}

const LoginPage = lazyPage(() =>
  import('@/modules/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazyPage(() =>
  import('@/modules/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const OtpPage = lazyPage(() =>
  import('@/modules/auth/pages/OtpPage').then((m) => ({ default: m.OtpPage })),
);
const ChangeMobilePage = lazyPage(() =>
  import('@/modules/auth/pages/ChangeMobilePage').then((m) => ({ default: m.ChangeMobilePage })),
);
const ForgotPasswordPage = lazyPage(() =>
  import('@/modules/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazyPage(() =>
  import('@/modules/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const UnauthorizedPage = lazyPage(() =>
  import('@/modules/auth/pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })),
);
const ForbiddenPage = lazyPage(() =>
  import('@/modules/auth/pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })),
);
const DeleteAccountPage = lazyPage(() =>
  import('@/modules/legal/pages/DeleteAccountPage').then((m) => ({ default: m.DeleteAccountPage })),
);
const PrivacyPolicyPage = lazyPage(() =>
  import('@/modules/legal/pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })),
);
const NotFoundPage = lazyPage(() =>
  import('@/shared/components/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

const NoSpacesPage = lazyPage(() =>
  import('@/modules/dashboard/pages/NoSpacesPage').then((m) => ({ default: m.NoSpacesPage })),
);
const DashboardPage = lazyPage(() =>
  import('@/modules/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const PendingActionsPage = lazyPage(() =>
  import('@/modules/dashboard/pages/PendingActionsPage').then((m) => ({
    default: m.PendingActionsPage,
  })),
);
const OccupancyListPage = lazyPage(() =>
  import('@/modules/dashboard/pages/OccupancyListPage').then((m) => ({
    default: m.OccupancyListPage,
  })),
);
const BedInventoryPage = lazyPage(() =>
  import('@/modules/dashboard/pages/BedInventoryPage').then((m) => ({
    default: m.BedInventoryPage,
  })),
);
const SpaceHealthPage = lazyPage(() =>
  import('@/modules/dashboard/pages/SpaceHealthPage').then((m) => ({
    default: m.SpaceHealthPage,
  })),
);
const MealHeadcountPage = lazyPage(() =>
  import('@/modules/dashboard/pages/MealHeadcountPage').then((m) => ({
    default: m.MealHeadcountPage,
  })),
);

const OnboardingChoicePage = lazyPage(() =>
  import('@/modules/onboarding/pages/OnboardingChoicePage').then((m) => ({
    default: m.OnboardingChoicePage,
  })),
);
const CreateSpacePage = lazyPage(() =>
  import('@/modules/onboarding/pages/CreateSpacePage').then((m) => ({
    default: m.CreateSpacePage,
  })),
);
const JoinSpacePage = lazyPage(() =>
  import('@/modules/onboarding/pages/JoinSpacePage').then((m) => ({ default: m.JoinSpacePage })),
);
const AcceptInvitationsPage = lazyPage(() =>
  import('@/modules/onboarding/pages/AcceptInvitationsPage').then((m) => ({
    default: m.AcceptInvitationsPage,
  })),
);
const MySpacesPage = lazyPage(() =>
  import('@/modules/onboarding/pages/MySpacesPage').then((m) => ({ default: m.MySpacesPage })),
);
const CompleteProfilePage = lazyPage(() =>
  import('@/modules/onboarding/pages/CompleteProfilePage').then((m) => ({
    default: m.CompleteProfilePage,
  })),
);
const SpaceDetailsPage = lazyPage(() =>
  import('@/modules/onboarding/pages/SpaceDetailsPage').then((m) => ({
    default: m.SpaceDetailsPage,
  })),
);
const EditSpacePage = lazyPage(() =>
  import('@/modules/onboarding/pages/EditSpacePage').then((m) => ({ default: m.EditSpacePage })),
);

const ProfilePage = lazyPage(() =>
  import('@/modules/profile/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const GlobalAttentionPage = lazyPage(() =>
  import('@/modules/global/pages/GlobalAttentionPage').then((m) => ({
    default: m.GlobalAttentionPage,
  })),
);
const GlobalActivityPage = lazyPage(() =>
  import('@/modules/global/pages/GlobalActivityPage').then((m) => ({
    default: m.GlobalActivityPage,
  })),
);
const GlobalMembersPage = lazyPage(() =>
  import('@/modules/global/pages/GlobalMembersPage').then((m) => ({
    default: m.GlobalMembersPage,
  })),
);
const GlobalMealsPage = lazyPage(() =>
  import('@/modules/global/pages/GlobalMealsPage').then((m) => ({
    default: m.GlobalMealsPage,
  })),
);
const GlobalPaymentsPage = lazyPage(() =>
  import('@/modules/global/pages/GlobalPaymentsPage').then((m) => ({
    default: m.GlobalPaymentsPage,
  })),
);
const GlobalComplaintsPage = lazyPage(() =>
  import('@/modules/global/pages/GlobalComplaintsPage').then((m) => ({
    default: m.GlobalComplaintsPage,
  })),
);
const GlobalNoticesPage = lazyPage(() =>
  import('@/modules/global/pages/GlobalNoticesPage').then((m) => ({
    default: m.GlobalNoticesPage,
  })),
);
const GlobalReportsPage = lazyPage(() =>
  import('@/modules/global/pages/GlobalReportsPage').then((m) => ({
    default: m.GlobalReportsPage,
  })),
);
const NotificationsPage = lazyPage(() =>
  import('@/modules/notifications/pages/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
);

const MembersWorkspacePage = lazyPage(() =>
  import('@/modules/members/pages/MembersWorkspacePage').then((m) => ({
    default: m.MembersWorkspacePage,
  })),
);
const ImportExistingPeoplePage = lazyPage(() =>
  import('@/modules/members/pages/ImportExistingPeoplePage').then((m) => ({
    default: m.ImportExistingPeoplePage,
  })),
);
const AddCustomersHubPage = lazyPage(() =>
  import('@/modules/members/pages/AddCustomersHubPage').then((m) => ({
    default: m.AddCustomersHubPage,
  })),
);

const AccommodationWorkspacePage = lazyPage(() =>
  import('@/modules/accommodation/pages/AccommodationWorkspacePage').then((m) => ({
    default: m.AccommodationWorkspacePage,
  })),
);
const QuickSetupWizardPage = lazyPage(() =>
  import('@/modules/accommodation/pages/QuickSetupWizardPage').then((m) => ({
    default: m.QuickSetupWizardPage,
  })),
);
const OccupancyWizardPage = lazyPage(() =>
  import('@/modules/accommodation/pages/OccupancyWizardPage').then((m) => ({
    default: m.OccupancyWizardPage,
  })),
);

const MealMenuEditorPage = lazyPage(() =>
  import('@/modules/meals/pages/MealMenuEditorPage').then((m) => ({
    default: m.MealMenuEditorPage,
  })),
);
const MealsHomePage = lazyPage(() =>
  import('@/modules/meals/pages/MealsHomePage').then((m) => ({ default: m.MealsHomePage })),
);
const MenuLibraryPage = lazyPage(() =>
  import('@/modules/meals/pages/MenuLibraryPage').then((m) => ({ default: m.MenuLibraryPage })),
);
const DeliveryLocationsPage = lazyPage(() =>
  import('@/modules/meals/pages/DeliveryLocationsPage').then((m) => ({
    default: m.DeliveryLocationsPage,
  })),
);
const MealParticipationPage = lazyPage(() =>
  import('@/modules/meals/pages/MealParticipationPage').then((m) => ({
    default: m.MealParticipationPage,
  })),
);
const MealSharePage = lazyPage(() =>
  import('@/modules/meals/pages/MealSharePage').then((m) => ({ default: m.MealSharePage })),
);
const MealPollResponsePage = lazyPage(() =>
  import('@/modules/meals/pages/MealPollResponsePage').then((m) => ({
    default: m.MealPollResponsePage,
  })),
);
const SubscriptionPlansWorkspacePage = lazyPage(() =>
  import('@/modules/meals/pages/SubscriptionPlansWorkspacePage').then((m) => ({
    default: m.SubscriptionPlansWorkspacePage,
  })),
);
const CustomerSubscriptionPlansPage = lazyPage(() =>
  import('@/modules/meals/pages/CustomerSubscriptionPlansPage').then((m) => ({
    default: m.CustomerSubscriptionPlansPage,
  })),
);
const DayMealPaymentsPage = lazyPage(() =>
  import('@/modules/meals/pages/DayMealPaymentsPage').then((m) => ({
    default: m.DayMealPaymentsPage,
  })),
);

const PaymentsWorkspacePage = lazyPage(() =>
  import('@/modules/payments/pages/PaymentsWorkspacePage').then((m) => ({
    default: m.PaymentsWorkspacePage,
  })),
);
const ComplaintsWorkspacePage = lazyPage(() =>
  import('@/modules/complaints/pages/ComplaintsWorkspacePage').then((m) => ({
    default: m.ComplaintsWorkspacePage,
  })),
);
const InventoryWorkspacePage = lazyPage(() =>
  import('@/modules/inventory/pages/InventoryWorkspacePage').then((m) => ({
    default: m.InventoryWorkspacePage,
  })),
);

const AdminDashboardPage = lazyPage(() =>
  import('@/modules/admin/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminPropertyListPage = lazyPage(() =>
  import('@/modules/admin/pages/AdminPropertyListPage').then((m) => ({ default: m.AdminPropertyListPage })),
);
const AdminPropertyDetailPage = lazyPage(() =>
  import('@/modules/admin/pages/AdminPropertyDetailPage').then((m) => ({ default: m.AdminPropertyDetailPage })),
);
const AdminAddPropertyPage = lazyPage(() =>
  import('@/modules/admin/pages/AdminAddPropertyPage').then((m) => ({ default: m.AdminAddPropertyPage })),
);
const AdminMessListPage = lazyPage(() =>
  import('@/modules/admin/pages/AdminMessListPage').then((m) => ({ default: m.AdminMessListPage })),
);
const AdminMessDetailPage = lazyPage(() =>
  import('@/modules/admin/pages/AdminMessDetailPage').then((m) => ({ default: m.AdminMessDetailPage })),
);
const AdminAddMessPage = lazyPage(() =>
  import('@/modules/admin/pages/AdminAddMessPage').then((m) => ({ default: m.AdminAddMessPage })),
);
const AdminRegisteredUsersPage = lazyPage(() =>
  import('@/modules/admin/pages/AdminRegisteredUsersPage').then((m) => ({
    default: m.AdminRegisteredUsersPage,
  })),
);
const AdminSavedAddressesPage = lazyPage(() =>
  import('@/modules/admin/pages/AdminSavedAddressesPage').then((m) => ({
    default: m.AdminSavedAddressesPage,
  })),
);
const AdminLayout = lazyPage(() =>
  import('@/modules/admin/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);

export const appRoutes = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <GuestRoute />,
        children: [
          {
            element: <AuthLayoutOutlet />,
            children: [
              {
                path: ROUTES.login,
                element: (
                  <L>
                    <LoginPage />
                  </L>
                ),
              },
              {
                path: ROUTES.loginOtp,
                element: (
                  <L>
                    <OtpPage />
                  </L>
                ),
              },
              {
                path: ROUTES.forgotPassword,
                element: (
                  <L>
                    <ForgotPasswordPage />
                  </L>
                ),
              },
              {
                path: ROUTES.forgotPasswordOtp,
                element: (
                  <L>
                    <OtpPage />
                  </L>
                ),
              },
              {
                path: ROUTES.resetPassword,
                element: (
                  <L>
                    <ResetPasswordPage />
                  </L>
                ),
              },
              {
                path: ROUTES.register,
                element: (
                  <L>
                    <RegisterPage />
                  </L>
                ),
              },
              /* OTP verification after Create Account. Password login is unchanged. */
              {
                path: ROUTES.registerOtp,
                element: (
                  <L>
                    <OtpPage />
                  </L>
                ),
              },
              {
                path: ROUTES.registerPassword,
                element: <Navigate to={ROUTES.register} replace />,
              },
              {
                path: ROUTES.otp,
                element: <Navigate to={ROUTES.register} replace />,
              },
            ],
          },
        ],
      },
      {
        path: ROUTES.adminLogin,
        element: <Navigate to={ROUTES.login} replace />,
      },
      {
        element: <AdminRoute />,
        children: [
          {
            element: (
              <L>
                <AdminLayout />
              </L>
            ),
            children: [
              {
                path: ROUTES.adminDashboard,
                element: (
                  <L>
                    <AdminDashboardPage />
                  </L>
                ),
              },
              {
                path: ROUTES.adminRegisteredUsers,
                element: (
                  <L>
                    <AdminRegisteredUsersPage />
                  </L>
                ),
              },
              {
                path: ROUTES.adminSavedAddresses,
                element: (
                  <L>
                    <AdminSavedAddressesPage />
                  </L>
                ),
              },
              {
                path: ROUTES.adminProperties,
                element: (
                  <L>
                    <AdminPropertyListPage />
                  </L>
                ),
              },
              {
                path: ROUTES.adminAddProperty,
                element: (
                  <L>
                    <AdminAddPropertyPage />
                  </L>
                ),
              },
              {
                path: `${ROUTES.adminProperties}/:id`,
                element: (
                  <L>
                    <AdminPropertyDetailPage />
                  </L>
                ),
              },
              {
                path: ROUTES.adminMess,
                element: (
                  <L>
                    <AdminMessListPage />
                  </L>
                ),
              },
              {
                path: ROUTES.adminAddMess,
                element: (
                  <L>
                    <AdminAddMessPage />
                  </L>
                ),
              },
              {
                path: `${ROUTES.adminMess}/:id`,
                element: (
                  <L>
                    <AdminMessDetailPage />
                  </L>
                ),
              },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AuthLayoutOutlet />,
            children: [
              {
                path: ROUTES.changeMobile,
                element: (
                  <L>
                    <ChangeMobilePage />
                  </L>
                ),
              },
              {
                path: ROUTES.changeMobileOtp,
                element: (
                  <L>
                    <OtpPage />
                  </L>
                ),
              },
            ],
          },
          {
            element: <SpaceBootstrapOutlet />,
            children: [
              { path: ROUTES.root, element: <AuthenticatedRootRedirect /> },
              {
                path: ROUTES.noSpaces,
                element: (
                  <L>
                    <NoSpacesPage />
                  </L>
                ),
              },
              {
                path: ROUTES.onboarding,
                element: (
                  <L>
                    <OnboardingChoicePage />
                  </L>
                ),
              },
              {
                path: ROUTES.createSpace,
                element: (
                  <L>
                    <CreateSpacePage />
                  </L>
                ),
              },
              {
                path: ROUTES.joinSpace,
                element: (
                  <L>
                    <JoinSpacePage />
                  </L>
                ),
              },
              {
                path: ROUTES.acceptInvitations,
                element: (
                  <L>
                    <AcceptInvitationsPage />
                  </L>
                ),
              },
              {
                path: ROUTES.completeProfile,
                element: (
                  <L>
                    <CompleteProfilePage />
                  </L>
                ),
              },
              {
                element: <GlobalShellLayout />,
                children: [
                  {
                    path: ROUTES.mySpaces,
                    element: (
                      <L>
                        <MySpacesPage />
                      </L>
                    ),
                  },
                  {
                    path: ROUTES.profile,
                    element: (
                      <L>
                        <ProfilePage />
                      </L>
                    ),
                  },
                  {
                    path: ROUTES.globalAttention,
                    element: (
                      <L>
                        <GlobalAttentionPage />
                      </L>
                    ),
                  },
                  {
                    path: ROUTES.globalActivity,
                    element: (
                      <L>
                        <GlobalActivityPage />
                      </L>
                    ),
                  },
                  {
                    path: ROUTES.globalMembers,
                    element: (
                      <L>
                        <GlobalMembersPage />
                      </L>
                    ),
                  },
                  {
                    path: ROUTES.globalMeals,
                    element: (
                      <L>
                        <GlobalMealsPage />
                      </L>
                    ),
                  },
                  {
                    path: ROUTES.globalPayments,
                    element: (
                      <L>
                        <GlobalPaymentsPage />
                      </L>
                    ),
                  },
                  {
                    path: ROUTES.globalComplaints,
                    element: (
                      <L>
                        <GlobalComplaintsPage />
                      </L>
                    ),
                  },
                  {
                    path: ROUTES.globalNotices,
                    element: (
                      <L>
                        <GlobalNoticesPage />
                      </L>
                    ),
                  },
                  {
                    path: ROUTES.globalReports,
                    element: (
                      <L>
                        <GlobalReportsPage />
                      </L>
                    ),
                  },
                ],
              },
              {
                path: '/spaces/:spaceId',
                element: <ProfileCompletionGate />,
                errorElement: <RouteErrorPage />,
                children: [
                  {
                    element: <SpaceShellLayout />,
                    errorElement: <RouteErrorPage />,
                    children: [
                      {
                        index: true,
                        element: (
                          <L>
                            <DashboardPage />
                          </L>
                        ),
                      },
                      {
                        path: 'dashboard',
                        element: (
                          <L>
                            <DashboardPage />
                          </L>
                        ),
                      },
                      {
                        path: 'details',
                        element: (
                          <L>
                            <SpaceDetailsPage />
                          </L>
                        ),
                      },
                      {
                        path: 'edit',
                        element: (
                          <L>
                            <EditSpacePage />
                          </L>
                        ),
                      },
                      {
                        path: 'pending-actions',
                        element: (
                          <L>
                            <PendingActionsPage />
                          </L>
                        ),
                      },
                      {
                        path: 'notifications',
                        element: (
                          <L>
                            <NotificationsPage />
                          </L>
                        ),
                      },
                      {
                        path: 'occupancy',
                        element: (
                          <L>
                            <OccupancyListPage />
                          </L>
                        ),
                      },
                      {
                        path: 'bed-inventory',
                        element: (
                          <L>
                            <BedInventoryPage />
                          </L>
                        ),
                      },
                      {
                        path: 'space-health',
                        element: (
                          <L>
                            <SpaceHealthPage />
                          </L>
                        ),
                      },
                      {
                        path: 'meal-headcount',
                        element: (
                          <L>
                            <MealHeadcountPage />
                          </L>
                        ),
                      },
                      {
                        path: 'members',
                        element: <MembersPermissionGate />,
                        children: [
                          {
                            index: true,
                            element: (
                              <L>
                                <MembersWorkspacePage />
                              </L>
                            ),
                          },
                          {
                            path: 'import',
                            element: (
                              <L>
                                <ImportExistingPeoplePage />
                              </L>
                            ),
                          },
                          {
                            path: 'add-hub',
                            element: (
                              <L>
                                <AddCustomersHubPage />
                              </L>
                            ),
                          },
                          {
                            path: ':memberId',
                            element: (
                              <L>
                                <MembersWorkspacePage />
                              </L>
                            ),
                          },
                        ],
                      },
                      {
                        path: 'accommodation',
                        element: <AccommodationPermissionGate />,
                        children: [
                          {
                            index: true,
                            element: (
                              <L>
                                <AccommodationWorkspacePage />
                              </L>
                            ),
                          },
                          {
                            path: 'quick-setup',
                            element: (
                              <L>
                                <QuickSetupWizardPage />
                              </L>
                            ),
                          },
                        ],
                      },
                      {
                        path: 'occupancy/wizard',
                        element: <AccommodationPermissionGate />,
                        children: [
                          {
                            index: true,
                            element: (
                              <L>
                                <OccupancyWizardPage />
                              </L>
                            ),
                          },
                        ],
                      },
                      {
                        path: 'meals',
                        element: <MealsPermissionGate />,
                        children: [
                          {
                            index: true,
                            element: (
                              <L>
                                <MealsHomePage />
                              </L>
                            ),
                          },
                          {
                            path: 'library',
                            element: (
                              <L>
                                <MenuLibraryPage />
                              </L>
                            ),
                          },
                          {
                            path: 'locations',
                            element: (
                              <L>
                                <DeliveryLocationsPage />
                              </L>
                            ),
                          },
                          {
                            path: 'participation',
                            element: (
                              <L>
                                <MealParticipationPage />
                              </L>
                            ),
                          },
                          {
                            path: 'share',
                            element: (
                              <L>
                                <MealSharePage />
                              </L>
                            ),
                          },
                          {
                            path: 'poll',
                            element: (
                              <L>
                                <MealPollResponsePage />
                              </L>
                            ),
                          },
                          {
                            path: 'plans',
                            element: (
                              <L>
                                <SubscriptionPlansWorkspacePage />
                              </L>
                            ),
                          },
                          {
                            path: 'plans/customer',
                            element: (
                              <L>
                                <CustomerSubscriptionPlansPage />
                              </L>
                            ),
                          },
                        ],
                      },
                      {
                        path: 'payments',
                        element: <PaymentsPermissionGate />,
                        children: [
                          {
                            index: true,
                            element: (
                              <L>
                                <PaymentsWorkspacePage />
                              </L>
                            ),
                          },
                          {
                            path: 'day-meals',
                            element: (
                              <L>
                                <DayMealPaymentsPage />
                              </L>
                            ),
                          },
                          {
                            path: ':paymentId',
                            element: (
                              <L>
                                <PaymentsWorkspacePage />
                              </L>
                            ),
                          },
                        ],
                      },
                      {
                        path: 'complaints',
                        element: <ComplaintsPermissionGate />,
                        children: [
                          {
                            index: true,
                            element: (
                              <L>
                                <ComplaintsWorkspacePage />
                              </L>
                            ),
                          },
                          {
                            path: ':complaintId',
                            element: (
                              <L>
                                <ComplaintsWorkspacePage />
                              </L>
                            ),
                          },
                        ],
                      },
                      {
                        path: 'inventory',
                        element: <InventoryPermissionGate />,
                        children: [
                          {
                            index: true,
                            element: (
                              <L>
                                <InventoryWorkspacePage />
                              </L>
                            ),
                          },
                          {
                            path: 'items/:itemId',
                            element: (
                              <L>
                                <InventoryWorkspacePage />
                              </L>
                            ),
                          },
                        ],
                      },
                    ],
                  },
                  {
                    path: 'meals/edit',
                    element: <MealsPermissionGate />,
                    children: [
                      {
                        index: true,
                        element: (
                          <L>
                            <MealMenuEditorPage />
                          </L>
                        ),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        element: <AuthLayoutOutlet />,
        children: [
          {
            path: ROUTES.deleteAccount,
            element: (
              <L>
                <DeleteAccountPage />
              </L>
            ),
          },
          {
            path: ROUTES.deleteAccountOtp,
            element: (
              <L>
                <OtpPage />
              </L>
            ),
          },
          {
            path: ROUTES.privacy,
            element: (
              <L>
                <PrivacyPolicyPage />
              </L>
            ),
          },
        ],
      },
      {
        path: ROUTES.unauthorized,
        element: (
          <L>
            <UnauthorizedPage />
          </L>
        ),
      },
      {
        path: ROUTES.forbidden,
        element: (
          <L>
            <ForbiddenPage />
          </L>
        ),
      },
      {
        path: ROUTES.notFound,
        element: (
          <L>
            <NotFoundPage />
          </L>
        ),
      },
      {
        path: '*',
        element: (
          <L>
            <NotFoundPage />
          </L>
        ),
      },
    ],
  },
];
