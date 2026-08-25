import { Box, useMediaQuery, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { SkipLink, MAIN_CONTENT_ID } from '@/shared/components/SkipLink';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { ContentLayout } from './ContentLayout';
import type { AppNavSection } from './navTypes';

type AppLayoutProps = {
  children?: ReactNode;
  navSections?: AppNavSection[];
  /** Optional panel between nav list and footer (e.g. customer space card). */
  sidebarPanel?: ReactNode;
  sidebarFooter?: ReactNode;
  /** Space selector / primary context — rendered on the left of the header. */
  headerLeading?: ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  headerActions?: ReactNode;
  /** When false, children fill the main area without ContentLayout padding. */
  padded?: boolean;
  /** Override ContentLayout max width (false = full bleed). */
  contentMaxWidth?: number | false;
  /** Tighter page padding for dense workspaces (e.g. dashboard). */
  contentDense?: boolean;
  /**
   * When true, main becomes a flex column with overflow hidden so nested
   * pages can fill height and own their own column scrolling.
   */
  lockContentScroll?: boolean;
  /** Account shell uses a pinned open sidebar; space shell keeps hover-expand. */
  sidebarExpandMode?: 'hover' | 'pinned';
};

/**
 * Authenticated application chrome: sidebar + header + content.
 * Nav items are injected by the router/shell when modules register.
 * Below `md`: temporary drawer + hamburger (permanent sidebar hidden).
 */
export function AppLayout({
  children,
  navSections = [],
  sidebarPanel,
  sidebarFooter,
  headerLeading,
  headerTitle,
  headerSubtitle,
  headerActions,
  padded = true,
  contentMaxWidth,
  contentDense = false,
  lockContentScroll = false,
  sidebarExpandMode = 'hover',
}: AppLayoutProps) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const mobileNavOpen = useAppStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useAppStore((state) => state.setMobileNavOpen);

  const content = children ?? <Outlet />;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <SkipLink />
      {isMdUp ? (
        <AppSidebar
          variant="permanent"
          open
          sections={navSections}
          panel={sidebarPanel}
          footer={sidebarFooter}
          expandMode={sidebarExpandMode}
        />
      ) : (
        <AppSidebar
          variant="temporary"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          sections={navSections}
          panel={sidebarPanel}
          footer={sidebarFooter}
          expandMode={sidebarExpandMode}
        />
      )}

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <AppHeader
          leading={headerLeading}
          title={headerTitle}
          subtitle={headerSubtitle}
          actions={headerActions}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <Box
          component="main"
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            outline: 'none',
            ...(lockContentScroll
              ? {
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  // Stretch route outlet so pages can lock to the main viewport height.
                  '& > *': {
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  },
                }
              : {
                  overflow: 'auto',
                  scrollbarGutter: 'stable',
                }),
          }}
        >
          {padded ? (
            <ContentLayout maxWidth={contentMaxWidth} dense={contentDense}>
              {content}
            </ContentLayout>
          ) : (
            // Dashboard owns its own ScaleShell — avoid double-wrapping.
            content
          )}
        </Box>
      </Box>
    </Box>
  );
}
