# Academic Catalog Professor API — Agent Spec

## Goal

Implement the backend contract expected by the SPA for:

- HU-21: professor registration (catalog)
- HU-22: professor search/list (partial — unified search param)
- HU-23: professor detail
- HU-24: professor update
- HU-45: logical deactivation (soft delete)

This file is optimized for backend implementation by an AI agent: short, explicit, and low-noise.

## Core Rules

1. `professorType` is either `INTERNO` or `EXTERNO`.
2. `employeeNumber` is **required** when `professorType = INTERNO`.
3. `employeeNumber` must be `null` or omitted when `professorType = EXTERNO`.
4. `employeeNumber` must be unique among **active internos** within the tenant.
5. `email` must be unique among users/professors within the tenant.
6. Deactivation is logical: set `users.active = false`; keep `professors` row.
7. Deactivation is blocked if professor is tutor or advisor of any student program with `status = ACTIVO`.
8. Inactive professors must not appear in `GET /professors?active=true` nor in active tutor/advisor selectors.
9. Inactive professors remain visible in historical references (student program detail) with `active = false` when resolved.
10. If both sabbatical dates are sent, `nextSabbaticalEnd >= nextSabbaticalStart`.
11. Password change is **not** part of this contract — use `PUT /api/users/{userId}/password` (HU-28).
12. Reactivation is out of scope.

## Auth / Headers

Required header on all requests:

```http
X-Graduate-Id: <graduateProgramId>
```

Coordinator role required for all endpoints in this spec.

## DTOs

### ProfessorType

```ts
'INTERNO' | 'EXTERNO'
```

### RegisterProfessorRequest

Required:
- `professorType`
- `email`
- `graduateProgramId`
- `firstName`
- `firstLastName`
- `phone`
- `commissionMember`

Conditional:
- `employeeNumber` — required when `professorType = INTERNO`; must be absent or `null` when `EXTERNO`

Optional:
- `secondLastName`
- `phoneExtension`
- `nextSabbaticalStart` (YYYY-MM-DD)
- `nextSabbaticalEnd` (YYYY-MM-DD)

```ts
{
  professorType: 'INTERNO' | 'EXTERNO';
  employeeNumber?: string | null;
  email: string;
  graduateProgramId: number;
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  phone: string;
  phoneExtension?: string;
  commissionMember: boolean;
  nextSabbaticalStart?: string;
  nextSabbaticalEnd?: string;
}
```

### UpdateProfessorRequest

Same shape as `RegisterProfessorRequest` without `graduateProgramId`.

### ProfessorCatalogItem / ProfessorDetailResponse

Detail uses the same payload as list item.

Always returned:
- `id`
- `userId`
- `professorType`
- `email`
- `graduateProgramId`
- `firstName`
- `firstLastName`
- `phone`
- `commissionMember`
- `active`

Optional:
- `employeeNumber` — present for internos; absent or `null` for externos
- `secondLastName`
- `phoneExtension`
- `nextSabbaticalStart`
- `nextSabbaticalEnd`

### RegisterProfessorResponse

Extends `ProfessorCatalogItem` with:
- `generatedPassword: string` (create-only)

### PageResponse\<ProfessorCatalogItem\>

Standard Spring page shape used by the SPA.

## Endpoints

### 1. List professors

```http
GET /api/professors?page={page}&size={size}&search={optional}&active={optional}
```

Purpose:
- professor catalog list (HU-22)
- populate tutor/advisor selectors with `active=true`

Query params:
- `search` — matches name, email, or employee number
- `active` — boolean filter; SPA defaults list to `active=true`

Response:
- paged `ProfessorCatalogItem`

### 2. Register professor

```http
POST /api/professors
```

Request:
- `RegisterProfessorRequest`

Response:
- `RegisterProfessorResponse`

Expected errors:
- `409` duplicate email
- `409` duplicate employee number (internos)
- `404` graduate program not found
- `400` validation (missing NEMP for interno, NEMP sent for externo, sabbatical order)

### 3. Get professor detail

```http
GET /api/professors/{professorId}
```

Purpose:
- professor detail screen (HU-23)

Response:
- `ProfessorDetailResponse`

Expected errors:
- `404` professor not found

### 4. Update professor

```http
PUT /api/professors/{professorId}
```

Purpose:
- professor edit screen (HU-24)

Request:
- `UpdateProfessorRequest`

Response:
- updated `ProfessorDetailResponse`

Expected errors:
- `404` professor not found
- `409` duplicate email
- `409` duplicate employee number
- `400` validation

Example — change Interno to Externo:

```json
{
  "professorType": "EXTERNO",
  "email": "externo@uam.mx",
  "firstName": "Juan",
  "firstLastName": "Pérez",
  "phone": "5510002000",
  "commissionMember": false
}
```

### 5. Deactivate professor

```http
PUT /api/professors/{professorId}/deactivate
```

Purpose:
- logical deactivation from edit screen (HU-45)

Request body:
- empty

Response:
- updated `ProfessorDetailResponse` with `active: false`

Expected errors:
- `404` professor not found
- `409` professor already inactive
- `409` professor has active tutor/advisor assignments

## Error Payload Shape

```json
{
  "error": "CONFLICT",
  "message": "Professor is tutor or advisor of an active student program"
}
```

## Stable Error Messages Expected By SPA

- `A user with this email already exists`
- `A professor with this employee number already exists`
- `Graduate program not found`
- `Professor not found`
- `Professor is already inactive`
- `Professor is tutor or advisor of an active student program`
- `Employee number is required for internal professors`
- `Sabbatical end date must be on or after start date`

## Backend Notes

1. On deactivate, set `users.active = false` for the linked `userId`.
2. Historical `ProfessorReference` in student programs should include `active: boolean` when resolved.
3. List endpoint with no `active` param may return all; SPA sends `active=true` by default on catalog list.
