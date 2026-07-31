# Page Template

Standard page structure for CountIn Web modules. Every list/ops page should follow this pattern so the product feels cohesive.

```
┌────────────────────────────────────────────────────────────┐
│ Breadcrumb                                                 │
│                                                            │
│ Page Title                              [Page Actions]     │
├────────────────────────────────────────────────────────────┤
│ Summary Cards (StatCard row — optional)                    │
├────────────────────────────────────────────────────────────┤
│ Search + Filters (SearchToolbar / FilterBar)               │
├────────────────────────────────────────────────────────────┤
│ Table / Cards (DataTable or card grid)                     │
├────────────────────────────────────────────────────────────┤
│ Pagination                                                 │
└────────────────────────────────────────────────────────────┘
```

## Components to compose

| Region | Component |
|--------|-----------|
| Breadcrumb | `Breadcrumbs` |
| Title + actions | `PageHeader` |
| Summary | `StatCard` inside `PageSection` |
| Search / filters | `SearchToolbar`, `FilterBar`, `TableToolbar` |
| Body | `DataTable` or `ContentCard` grid |
| Footer | `Pagination` / `StickyFooter` for forms |
| Page chrome | `PageContainer` + `ContentLayout` |

## Rules

1. Do not invent module-specific headers or empty states — reuse shared components.  
2. Detail pages may use `SidePanel` / `AppDrawer` instead of a full table body.  
3. Forms use `FormSection` + `StickyFooter`.  
4. Keep business copy and permissions in the module; layout stays generic.
