export type ListingActionInput = {
  publication?: string | null;
  kind?: string | null;
  spaceType?: string | null;
  spaceId?: string | null;
  publicPath?: string | null;
  managePath?: string | null;
  accommodationPath?: string | null;
  mealsPath?: string | null;
  operationalManagementAvailable?: boolean;
};

export function showsPublicListing(listing: ListingActionInput): boolean {
  return listing.publication === 'LIVE' && Boolean(listing.spaceId) && Boolean(listing.publicPath);
}

export function showsAccommodation(listing: ListingActionInput): boolean {
  return (
    listing.publication === 'LIVE' &&
    listing.operationalManagementAvailable === true &&
    listing.kind !== 'MESS' &&
    listing.spaceType !== 'MESS' &&
    Boolean(listing.accommodationPath)
  );
}

export function showsMeals(listing: ListingActionInput): boolean {
  return (
    listing.publication === 'LIVE' &&
    listing.operationalManagementAvailable === true &&
    (listing.kind === 'MESS' || listing.spaceType === 'MESS') &&
    Boolean(listing.mealsPath)
  );
}

export function pendingHasNoPublicLink(listing: ListingActionInput): boolean {
  return listing.publication === 'PENDING' && !showsPublicListing(listing) && !showsAccommodation(listing);
}
