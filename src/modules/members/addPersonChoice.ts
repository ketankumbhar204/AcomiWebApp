export type ImportCandidateEligibility = {
  availableForMoveIn?: boolean;
  alreadyInTargetSpace?: boolean;
};

/**
 * People who can be reused in the destination space.
 * Someone already in the destination stays listed with Add hidden.
 * An active stay in another space can still be copied; move-in uses availableForMoveIn.
 */
export function isImportableCandidate(candidate: ImportCandidateEligibility): boolean {
  return candidate.alreadyInTargetSpace !== true;
}

export function countImportableCandidates(
  candidates: readonly ImportCandidateEligibility[],
): number {
  return candidates.reduce(
    (count, candidate) => count + (isImportableCandidate(candidate) ? 1 : 0),
    0,
  );
}

/** Choice dialog only when reuse would not be an empty list. */
export function shouldOfferImportChoice(importableCount: number): boolean {
  return importableCount > 0;
}

export type AddPersonNoun = 'customer' | 'member';

export type AddPersonEntry = 'new' | 'import';

export type AddPersonDestination = { type: 'form'; pickerMode: 'new' | 'search' };

/** Mess spaces speak about customers. Other spaces speak about members. */
export function addPersonNoun(spaceType: string | undefined): AddPersonNoun {
  return spaceType === 'MESS' ? 'customer' : 'member';
}

/**
 * Only Mess offers "Use existing customer" when adding a person.
 * Lodging Add Member always creates new; reuse happens in the Move-in wizard.
 */
export function addPersonOffersReuse(spaceType: string | undefined): boolean {
  return spaceType === 'MESS';
}

/**
 * Which flow to open after the choice dialog.
 * Mess "use existing" stays inside the member form (cross-space search).
 * Lodging never opens a standalone import page.
 */
export function destinationForAddPersonChoice(
  spaceType: string | undefined,
  entry: AddPersonEntry,
): AddPersonDestination {
  if (entry === 'import' && addPersonOffersReuse(spaceType)) {
    return { type: 'form', pickerMode: 'search' };
  }
  return { type: 'form', pickerMode: 'new' };
}
