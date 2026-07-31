import { Box, Pagination as MuiPagination, Typography } from '@mui/material';

type PaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  /** 0-based page index when true (matches Spring Pageable). Default false (1-based UI). */
  zeroBased?: boolean;
};

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  zeroBased = false,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1)));
  const uiPage = zeroBased ? page + 1 : page;
  const from = totalItems === 0 ? 0 : (uiPage - 1) * pageSize + 1;
  const to = Math.min(uiPage * pageSize, totalItems);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        pt: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {totalItems === 0 ? 'No results' : `Showing ${from}–${to} of ${totalItems}`}
      </Typography>
      <MuiPagination
        color="primary"
        page={uiPage}
        count={totalPages}
        onChange={(_, next) => onPageChange(zeroBased ? next - 1 : next)}
        siblingCount={1}
        boundaryCount={1}
      />
    </Box>
  );
}
