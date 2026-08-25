import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Columns3 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ContentCard } from './ContentCard';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { Pagination } from './Pagination';
import { TableToolbar } from './TableToolbar';

const TABLE_HEADER_HEIGHT = 44;
const TABLE_ROW_HEIGHT = 52;

export type DataTableSortDirection = 'asc' | 'desc';

export type DataTableColumn<T> = {
  id: string;
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  /** Hide on narrow screens when card fallback is used. */
  primary?: boolean;
};

export type DataTableProps<T extends { id: string }> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  getRowId?: (row: T) => string;
  /** Controlled search */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchInputId?: string;
  /** Controlled sort */
  sortBy?: string;
  sortDirection?: DataTableSortDirection;
  onSortChange?: (columnId: string, direction: DataTableSortDirection) => void;
  /** Controlled pagination (0-based page to match Spring unless overridden) */
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  zeroBasedPage?: boolean;
  /** Selection */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: ReactNode;
  toolbarActions?: ReactNode;
  toolbarFilters?: ReactNode;
  /** Optional strip between toolbar and table (e.g. attention callout). */
  banner?: ReactNode;
  onRowClick?: (row: T) => void;
};

function cellValue<T>(row: T, column: DataTableColumn<T>): ReactNode {
  if (!column.accessor) {
    return null;
  }
  if (typeof column.accessor === 'function') {
    return column.accessor(row);
  }
  const value = row[column.accessor];
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return value as ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading = false,
  emptyTitle = 'No results',
  emptyDescription = 'Try adjusting search or filters.',
  getRowId = (row) => row.id,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchInputId,
  sortBy,
  sortDirection = 'asc',
  onSortChange,
  page = 0,
  pageSize = 20,
  totalItems,
  onPageChange,
  zeroBasedPage = true,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  toolbarActions,
  toolbarFilters,
  banner,
  onRowClick,
}: DataTableProps<T>) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'));
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([]);

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumnIds.includes(column.id)),
    [columns, hiddenColumnIds],
  );

  const resolvedTotal = totalItems ?? rows.length;
  const allVisibleSelected =
    rows.length > 0 && rows.every((row) => selectedIds.includes(getRowId(row)));
  const someSelected = rows.some((row) => selectedIds.includes(getRowId(row)));

  const toggleAll = () => {
    if (!onSelectionChange) {
      return;
    }
    if (allVisibleSelected) {
      const visibleIds = new Set(rows.map(getRowId));
      onSelectionChange(selectedIds.filter((id) => !visibleIds.has(id)));
      return;
    }
    const merged = new Set(selectedIds);
    rows.forEach((row) => merged.add(getRowId(row)));
    onSelectionChange([...merged]);
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) {
      return;
    }
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((value) => value !== id));
      return;
    }
    onSelectionChange([...selectedIds, id]);
  };

  const handleSort = (columnId: string) => {
    if (!onSortChange) {
      return;
    }
    if (sortBy === columnId) {
      onSortChange(columnId, sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    onSortChange(columnId, 'asc');
  };

  const columnVisibilityControl = (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<Columns3 size={14} />}
        onClick={(event) => setColumnMenuAnchor(event.currentTarget)}
        sx={dashOutlinedButtonSx}
      >
        Columns
      </Button>
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
      >
        {columns.map((column) => (
          <MenuItem key={column.id} dense disableRipple>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={!hiddenColumnIds.includes(column.id)}
                  onChange={(_, checked) => {
                    setHiddenColumnIds((current) =>
                      checked
                        ? current.filter((id) => id !== column.id)
                        : [...current, column.id],
                    );
                  }}
                />
              }
              label={column.header}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <TableToolbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        searchInputId={searchInputId}
        selectedCount={selectedIds.length}
        bulkActions={bulkActions}
        filters={toolbarFilters}
        actions={
          <>
            {columnVisibilityControl}
            {toolbarActions}
          </>
        }
      />

      {banner}

      <ContentCard padded={false}>
        {loading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : isNarrow ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5 }}>
            {rows.map((row) => {
              const id = getRowId(row);
              const primaryColumns = visibleColumns.filter((column) => column.primary !== false);
              return (
                <Box
                  key={id}
                  onClick={() => onRowClick?.(row)}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick ? `Open row ${id}` : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  sx={{
                    border: `1px solid ${s.border}`,
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    bgcolor: s.elevated,
                    p: `${DASHBOARD_UX.metricPadding}px`,
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: DASHBOARD_UX.transition,
                    '&:hover': onRowClick ? { boxShadow: s.shadowHover } : undefined,
                    '&:focus-visible': onRowClick
                      ? {
                          outline: `2px solid ${theme.palette.primary.main}`,
                          outlineOffset: 2,
                        }
                      : undefined,
                  }}
                >
                  {selectable ? (
                    <Checkbox
                      size="small"
                      checked={selectedIds.includes(id)}
                      onChange={() => toggleRow(id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  ) : null}
                  {primaryColumns.slice(0, 4).map((column) => (
                    <Box
                      key={column.id}
                      sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.5 }}
                    >
                      <Box
                        component="span"
                        sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}
                      >
                        {column.header}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          ...DASHBOARD_UX.metricLabel,
                          color: s.textPrimary,
                          textAlign: 'right',
                        }}
                      >
                        {cellValue(row, column)}
                      </Box>
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        ) : (
          <TableContainer>
            <Table
              size="small"
              sx={{
                tableLayout: 'auto',
                '& .MuiTableCell-root': {
                  borderColor: s.border,
                  ...DASHBOARD_UX.body,
                  color: s.textPrimary,
                  py: 0,
                },
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    height: TABLE_HEADER_HEIGHT,
                    bgcolor: theme.palette.mode === 'dark' ? s.elevated : s.pageBg,
                  }}
                >
                  {selectable ? (
                    <TableCell padding="checkbox" sx={{ height: TABLE_HEADER_HEIGHT }}>
                      <Checkbox
                        size="small"
                        indeterminate={someSelected && !allVisibleSelected}
                        checked={allVisibleSelected}
                        onChange={toggleAll}
                        slotProps={{ input: { 'aria-label': 'Select all rows' } }}
                      />
                    </TableCell>
                  ) : null}
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align ?? 'left'}
                      sortDirection={sortBy === column.id ? sortDirection : false}
                      sx={{
                        width: column.width,
                        height: TABLE_HEADER_HEIGHT,
                        ...DASHBOARD_UX.caption,
                        fontWeight: 600,
                        color: s.textMuted,
                        textTransform: 'none',
                        letterSpacing: 0,
                      }}
                    >
                      {column.sortable && onSortChange ? (
                        <TableSortLabel
                          active={sortBy === column.id}
                          direction={sortBy === column.id ? sortDirection : 'asc'}
                          onClick={() => handleSort(column.id)}
                        >
                          {column.header}
                        </TableSortLabel>
                      ) : (
                        column.header
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const id = getRowId(row);
                  const selected = selectedIds.includes(id);
                  return (
                    <TableRow
                      key={id}
                      selected={selected}
                      onClick={() => onRowClick?.(row)}
                      sx={{
                        height: TABLE_ROW_HEIGHT,
                        cursor: onRowClick ? 'pointer' : 'default',
                        transition: 'background-color 120ms ease',
                        '&:hover': {
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? `${colors.primaryDark}22`
                              : `${colors.primaryDark}0A`,
                        },
                        '&.Mui-selected': {
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? `${colors.primaryDark}33`
                              : colors.lightGreen,
                        },
                        '&.Mui-selected:hover': {
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? `${colors.primaryDark}44`
                              : `${colors.primaryDark}14`,
                        },
                      }}
                    >
                      {selectable ? (
                        <TableCell
                          padding="checkbox"
                          onClick={(event) => event.stopPropagation()}
                          sx={{ height: TABLE_ROW_HEIGHT }}
                        >
                          <Checkbox
                            size="small"
                            checked={selected}
                            onChange={() => toggleRow(id)}
                          />
                        </TableCell>
                      ) : null}
                      {visibleColumns.map((column) => (
                        <TableCell
                          key={column.id}
                          align={column.align ?? 'left'}
                          sx={{ height: TABLE_ROW_HEIGHT }}
                        >
                          {cellValue(row, column)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </ContentCard>

      {onPageChange ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={resolvedTotal}
          onPageChange={onPageChange}
          zeroBased={zeroBasedPage}
        />
      ) : null}
    </Box>
  );
}
