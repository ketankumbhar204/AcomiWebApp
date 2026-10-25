import type { PropertyLayoutMode } from '@/shared/types/accommodation';
import type { SpaceType } from '@/shared/types/space';
import { defaultLayoutModeForSpaceType, selectableLayoutModes } from './accommodationProfile.ts';

export type WizardLayoutDecision = {
  layoutMode: PropertyLayoutMode | null;
  userChoseLayout: boolean;
  spaceChanged: boolean;
};

/**
 * Picks a layout the existing profile allows.
 * A missing space type leaves the current choice alone so a permissions refresh
 * cannot lock the wizard on PG or wipe a valid selection.
 * An explicit choice is kept only while it is legal for the loaded type.
 */
export function decideWizardLayout(input: {
  previousSpaceId: string | null;
  spaceId: string;
  spaceType: SpaceType | null | undefined;
  layoutMode: PropertyLayoutMode | null;
  userChoseLayout: boolean;
}): WizardLayoutDecision {
  if (input.previousSpaceId !== input.spaceId) {
    return { layoutMode: null, userChoseLayout: false, spaceChanged: true };
  }

  if (!input.spaceType) {
    return {
      layoutMode: input.layoutMode,
      userChoseLayout: input.userChoseLayout,
      spaceChanged: false,
    };
  }

  const allowed = selectableLayoutModes(input.spaceType);
  if (allowed.length === 0) {
    return { layoutMode: null, userChoseLayout: false, spaceChanged: false };
  }

  if (
    input.userChoseLayout &&
    input.layoutMode != null &&
    allowed.includes(input.layoutMode)
  ) {
    return {
      layoutMode: input.layoutMode,
      userChoseLayout: true,
      spaceChanged: false,
    };
  }

  return {
    layoutMode: defaultLayoutModeForSpaceType(input.spaceType),
    userChoseLayout: false,
    spaceChanged: false,
  };
}

export function isSubmittableSetupLayout(
  spaceType: SpaceType | null | undefined,
  layoutMode: PropertyLayoutMode | null | undefined,
): boolean {
  if (!spaceType || !layoutMode) {
    return false;
  }
  return selectableLayoutModes(spaceType).includes(layoutMode);
}
