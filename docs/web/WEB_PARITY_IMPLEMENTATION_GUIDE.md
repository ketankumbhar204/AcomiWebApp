# Web Functional Parity Implementation Guide
**Version:** 1.0
**Status:** Implementation Guide
**Purpose:** Achieve 100% functional parity between React Native (Source of Truth) and React Web.

---

# Objective

React Native is the functional source of truth.

The goal is NOT to redesign product behavior.

The goal is to ensure every workflow, API call, permission, action, navigation, validation, and business rule behaves exactly like the mobile application.

Desktop UX may improve layout and productivity, but functionality must remain identical.

---

# Source of Truth

## Mobile

K:\Amico

## Backend

K:\Projects\Amico\Backend\amico-backend (now amico-backend Maven artifact)
## Web

K:\AmicoWeb

---

# Mandatory References

Before implementing ANY feature, read the following documents.

1. FUNCTIONAL_PARITY_AUDIT.md
2. SCREEN_PARITY_MATRIX.md
3. API_PARITY.md
4. ACTION_PARITY.md
5. NAVIGATION_PARITY.md
6. PERMISSION_PARITY.md
7. GAP_IMPLEMENTATION_CHECKLIST.md

These documents define the implementation contract.

Never ignore them.

---

# Golden Rules

## 1.

Never invent new features.

If it does not exist on Mobile,
do not implement it on Web.

---

## 2.

Desktop UX improvements are allowed.

Examples

Workspace

Inspector

Drawer

Master Detail

Data Tables

Keyboard Shortcuts

Sticky Toolbars

Resizable Panels

These are considered parity as long as actions remain identical.

---

## 3.

Business logic must NEVER change.

Do not change

validation

permissions

status flow

API sequence

payloads

backend contracts

---

## 4.

Reuse existing APIs.

Never duplicate backend logic.

Never create alternate implementations.

---

## 5.

Backend is the single source of truth.

Never move business logic into the frontend.

---

# Functional Parity Checklist

For EVERY screen compare Mobile against Web.

---

## Navigation

Compare

Routes

Navigation

Breadcrumbs

Back behavior

Cancel behavior

Deep links

Redirects

Drawer opening

Inspector opening

Modal flow

Wizard flow

---

## UI Components

Verify

Buttons

Links

Menus

Tabs

Dropdowns

Accordions

Cards

Context menus

Overflow menus

Dialogs

Drawers

Inspectors

Bottom sheets

Date pickers

Search bars

Filters

Sorts

Pagination

Tables

Selection

Bulk actions

Quick actions

Badges

Chips

Progress indicators

Timeline

Status pills

Icons

Empty states

Error states

Loading states

Skeletons

---

## User Actions

Verify every action.

Examples

Create

Edit

Delete

Duplicate

Deactivate

Restore

Assign

Unassign

Approve

Reject

Cancel

Move

Transfer

Reserve

Allocate

Vacate

Import

Export

Refresh

Retry

Copy

Share

Upload

Download

Preview

Print

Sync

Submit

Confirm

Dismiss

Open

Close

Expand

Collapse

Mark Read

Navigate

Search

Filter

Sort

---

## API Verification

For every screen verify

Every API called

API order

Payload

Parameters

Headers

Response mapping

Mutation

Cache invalidation

Optimistic updates

Error handling

Retry logic

Loading state

Empty state

Refresh behavior

Polling

Background refresh

Permission failures

---

## Validation

Compare

Required fields

Optional fields

Maximum lengths

Minimum lengths

Regex

Allowed values

Disabled fields

Readonly fields

Error messages

Confirmation dialogs

Warnings

---

## Permissions

Verify every role.

OWNER

MANAGER

STAFF

TENANT

CUSTOMER

Check

Visibility

Read

Create

Edit

Delete

Approve

Reject

Navigation

Buttons

Menus

Drawer actions

Inspector actions

Context menus

---

## Workflows

Every workflow must match Mobile.

Example

Open

Edit

Save

Refresh

Return

Every intermediate state must exist.

---

## UX Behaviour

Verify

Loading

Empty

Success

Failure

Offline

Network retry

Pagination

Search debounce

Infinite scroll

Refresh

Selection persistence

Filter persistence

Sort persistence

Drawer persistence

Unsaved changes

Confirmation dialogs

Toasts

Snackbars

---

# Current Web Gaps

Implement these in order.

---

## Phase 1

Members — **COMPLETE (2026-07-31)**

Implement

~~Member Documents~~ ✅

~~Upload / View / Delete~~ ✅ (admin metadata + `pending-upload`, matches mobile)

~~Member Status Editor~~ ✅

~~Deposit Editor~~ ✅

~~Emergency Contact Editor~~ ✅

Connect all existing APIs ✅

Permission checks ✅

Loading / Error states / Success toasts / Inspector refresh ✅

---

## Phase 2

Accommodation — **COMPLETE (2026-07-31)**

~~Duplicate Building~~ ✅

~~Duplicate Floor~~ ✅

~~Duplicate Room~~ ✅

~~Confirmation dialogs / Success toast / Permission validation / Navigate to duplicated entity~~ ✅

---

## Phase 3

Dashboard — **COMPLETE (2026-07-31)**

~~Dedicated Space Health page~~ ✅

~~Dashboard Health navigation~~ ✅

~~Meal Headcount Detail page~~ ✅

~~Dashboard drill-down parity~~ ✅

---

## Phase 4

Optional Shared Features — **COMPLETE / VERIFIED SKIP (2026-07-31)**

Notification Resolve — **Skipped**

- Mobile: `notificationsApi.resolve` exists; `SpaceNotificationsScreen` only calls `markRead`. No resolve button/dialog.
- Web: must not invent resolve UI.

Inventory Delete — **Skipped**

- Mobile: `inventoryApi.deleteItem` / `deleteCategory` exist; no screen/component call sites.
- Web: hooks exist; must not invent delete UI.

Revisit only after Mobile ships UI for these actions.

---

# Definition of Done

A screen is complete ONLY IF

✓ All APIs match Mobile

✓ All buttons exist

✓ All menus exist

✓ All tabs exist

✓ All links exist

✓ All actions exist

✓ All dialogs exist

✓ All drawers exist

✓ All permissions match

✓ All validations match

✓ All navigation matches

✓ All workflows match

✓ All loading states match

✓ All empty states match

✓ All error states match

✓ All success messages match

✓ All backend contracts reused

✓ No duplicate business logic

✓ No web-only functionality

---

# After Every Screen

Cursor must verify

1.
Missing APIs

2.
Missing buttons

3.
Missing actions

4.
Missing permissions

5.
Missing navigation

6.
Missing validation

7.
Missing workflows

8.
Missing loading states

9.
Missing empty states

10.
Missing error handling

11.
Missing role restrictions

12.
Remaining parity percentage

---

# Completion Criteria

The project is complete only when

SCREEN_PARITY_MATRIX.md

ACTION_PARITY.md

API_PARITY.md

NAVIGATION_PARITY.md

PERMISSION_PARITY.md

FUNCTIONAL_PARITY_AUDIT.md

all report

100% Functional Parity

with

ZERO missing APIs

ZERO missing actions

ZERO missing workflows

ZERO missing permissions

ZERO missing navigation differences

Desktop layout improvements are acceptable, but functional behavior must remain identical to the React Native application.