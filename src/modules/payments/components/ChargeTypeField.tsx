import { createElement, useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import {
  Box,
  ClickAwayListener,
  InputAdornment,
  Paper,
  Popper,
  TextField,
  Typography,
} from '@mui/material';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  chargeTypeMatchesQuery,
  findCatalogChargeType,
  listCatalogChargeTypes,
  type CatalogChargeType,
} from '../chargeCatalog';
import { CHARGE_CATEGORY_BADGE, getChargeTypeIcon } from '../chargeTypeIcons';
import { readRecentChargeTypeIds } from '../recentChargeTypes';

type ChargeTypeFieldProps = {
  spaceId: string;
  typeId: string;
  onChange: (type: CatalogChargeType | null) => void;
};

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  const index = needle ? text.toLowerCase().indexOf(needle.toLowerCase()) : -1;
  if (index < 0) {
    return <>{text}</>;
  }
  return (
    <>
      {text.slice(0, index)}
      <Box component="span" sx={{ fontWeight: 800 }}>
        {text.slice(index, index + needle.length)}
      </Box>
      {text.slice(index + needle.length)}
    </>
  );
}

export function ChargeTypeField({ spaceId, typeId, onChange }: ChargeTypeFieldProps) {
  const { t } = useTranslation();
  const listId = useId();
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [menuWidth, setMenuWidth] = useState<number>();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const selected = typeId ? findCatalogChargeType(typeId) : undefined;
  const allTypes = useMemo(() => listCatalogChargeTypes(), []);
  const labelOf = (id: string) => t(`paymentCollection.chargeCatalog.types.${id}`);
  const categoryOf = (id: string) => t(`paymentCollection.chargeCatalog.categories.${id}`);

  const matches = (type: CatalogChargeType) => chargeTypeMatchesQuery(labelOf(type.id), query);
  const recent = recentIds
    .map((id) => allTypes.find((type) => type.id === id))
    .filter((type): type is CatalogChargeType => Boolean(type))
    .filter(matches);
  const all = allTypes.filter(matches);
  const rows = [...recent, ...all];

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const openMenu = () => {
    setMenuWidth(anchorEl?.clientWidth);
    if (!open) {
      setRecentIds(readRecentChargeTypeIds(spaceId));
      setActiveIndex(0);
      setOpen(true);
    }
  };

  const close = (event?: Event | { target?: EventTarget | null }) => {
    const target = event?.target;
    if (target instanceof Node && document.getElementById(listId)?.contains(target)) {
      return;
    }
    setOpen(false);
    setQuery('');
  };

  const choose = (type: CatalogChargeType) => {
    onChange(type);
    close();
  };

  const selectedLabel = selected ? labelOf(selected.id) : '';
  const selectedIcon = selected ? getChargeTypeIcon(selected.id) : Search;

  return (
    <ClickAwayListener onClickAway={close}>
      <Box ref={setAnchorEl}>
        <TextField
          fullWidth
          required
          label={t('paymentCollection.addRecord.type')}
          placeholder={t('paymentCollection.addRecord.searchChargeType')}
          value={open ? query : selectedLabel}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            openMenu();
          }}
          onFocus={openMenu}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              if (!open) {
                openMenu();
              } else {
                setActiveIndex((index) => Math.min(index + 1, Math.max(rows.length - 1, 0)));
              }
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter' && open) {
              event.preventDefault();
              const next = rows[activeIndex];
              if (next) {
                choose(next);
              }
            } else if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
          }}
          slotProps={{
            htmlInput: {
              role: 'combobox',
              'aria-expanded': open,
              'aria-controls': listId,
              'aria-autocomplete': 'list',
              'aria-activedescendant': open && rows[activeIndex] ? `${listId}-option-${activeIndex}` : undefined,
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {createElement(selectedIcon, { size: 16, 'aria-hidden': true })}
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {selected && !open ? (
                    <Box
                      component="button"
                      type="button"
                      aria-label={t('paymentCollection.addRecord.clearChargeType')}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onChange(null)}
                      sx={{
                        border: 0,
                        p: 0,
                        mr: 0.5,
                        bgcolor: 'transparent',
                        color: 'text.secondary',
                        display: 'inline-flex',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={16} />
                    </Box>
                  ) : null}
                  <ChevronDown size={16} aria-hidden />
                </InputAdornment>
              ),
            },
          }}
        />
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-start"
          sx={{ zIndex: (theme) => theme.zIndex.modal + 1, width: menuWidth }}
        >
          <Paper
            id={listId}
            role="listbox"
            aria-label={t('paymentCollection.addRecord.type')}
            elevation={3}
            sx={{
              mt: 0.5,
              width: '100%',
              maxHeight: 320,
              overflow: 'auto',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              py: 0.5,
            }}
          >
            {rows.length === 0 ? (
              <Box sx={{ px: 2, py: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                  {t('paymentCollection.addRecord.noChargeTypes')}
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
                  {t('paymentCollection.addRecord.tryAnotherSearch')}
                </Typography>
              </Box>
            ) : (
              <>
                {recent.length > 0 ? (
                  <Section
                    title={t('paymentCollection.addRecord.recent')}
                    types={recent}
                    query={query}
                    activeIndex={activeIndex}
                    selectedId={typeId}
                    listId={listId}
                    labelOf={labelOf}
                    categoryOf={categoryOf}
                    activeRef={activeRef}
                    onHover={setActiveIndex}
                    rowOffset={0}
                    onChoose={choose}
                  />
                ) : null}
                <Section
                  title={t('paymentCollection.addRecord.allChargeTypes')}
                  types={all}
                  query={query}
                  activeIndex={activeIndex}
                  selectedId={typeId}
                  listId={listId}
                  labelOf={labelOf}
                  categoryOf={categoryOf}
                  activeRef={activeRef}
                  onHover={setActiveIndex}
                  rowOffset={recent.length}
                  onChoose={choose}
                />
              </>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

function Section({
  title,
  types,
  query,
  activeIndex,
  selectedId,
  listId,
  labelOf,
  categoryOf,
  activeRef,
  onHover,
  rowOffset,
  onChoose,
}: {
  title: string;
  types: CatalogChargeType[];
  query: string;
  activeIndex: number;
  selectedId: string;
  listId: string;
  labelOf: (id: string) => string;
  categoryOf: (id: string) => string;
  activeRef: RefObject<HTMLButtonElement | null>;
  onHover: (index: number) => void;
  rowOffset: number;
  onChoose: (type: CatalogChargeType) => void;
}) {
  if (types.length === 0) {
    return null;
  }
  return (
    <Box>
      <Typography
        sx={{
          px: 1.5,
          pt: 1,
          pb: 0.5,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: 'text.secondary',
        }}
      >
        {title}
      </Typography>
      {types.map((type, index) => {
        const icon = getChargeTypeIcon(type.id);
        const badge = CHARGE_CATEGORY_BADGE[type.category];
        const label = labelOf(type.id);
        const active = rowOffset + index === activeIndex;
        const selected = type.id === selectedId;
        return (
          <Box
            key={`${title}-${type.id}`}
            component="button"
            type="button"
            id={`${listId}-option-${rowOffset + index}`}
            role="option"
            aria-selected={selected}
            ref={active ? activeRef : undefined}
            onMouseEnter={() => onHover(rowOffset + index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChoose(type)}
            sx={{
              width: '100%',
              border: 0,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.5,
              py: 1,
              cursor: 'pointer',
              bgcolor: active || selected ? '#F0FDF4' : 'transparent',
              '&:hover': { bgcolor: '#F0FDF4' },
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: badge.bg,
                color: badge.color,
                flexShrink: 0,
              }}
            >
              {createElement(icon, { size: 15, 'aria-hidden': true })}
            </Box>
            <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600, minWidth: 0 }} noWrap>
              <Highlight text={label} query={query} />
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: '999px',
                bgcolor: badge.bg,
                color: badge.color,
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {categoryOf(type.category)}
            </Box>
            {selected ? <Check size={16} color="#16A34A" aria-hidden /> : null}
          </Box>
        );
      })}
    </Box>
  );
}
