# Academic Catalog UEA API — Agent Spec

## Goal

Implement the backend contract expected by the SPA for:

- HU-39: consulta y alta individual del catálogo de UEAs
- HU-46: carga masiva del catálogo de UEAs (.xlsx / .csv)

This file is optimized for backend implementation by an AI agent: short, explicit, and low-noise.

## Core Rules

1. `clave` is unique per graduate program (tenant-scoped) and immutable after creation.
2. `creditos` must be a positive integer (> 0).
3. `horasTeoria` and `horasPractica` accept decimals (e.g. `4.5`); both ≥ 0.
4. `tipo` is either `OBLIGATORIA` or `OPTATIVA`.
5. `tipoFormacion` is one of `BASICA`, `COMPLEMENTARIA`, `INVESTIGACION`.
6. `modalidad` is always `MIXTA` (only valid value for now).
7. `active` defaults to `true` on creation.
8. Bulk upload is **all-or-nothing**: if any row has an error, nothing is inserted and `created = 0`.
9. Backend must parse both `.xlsx` and `.csv` files; the SPA sends the raw file as multipart.

## Auth / Headers

Required header on all requests:

```http
X-Graduate-Id: <graduateProgramId>
```

The SPA also sends the authenticated session/cookies.

## DTOs

### RegisterUeaRequest

All fields required:

```ts
{
  clave: string;              // max 20 chars, unique within tenant
  nombre: string;             // max 200 chars
  tipo: 'OBLIGATORIA' | 'OPTATIVA';
  modalidad: 'MIXTA';
  horasTeoria: number;        // >= 0, decimals allowed
  horasPractica: number;      // >= 0, decimals allowed
  tipoFormacion: 'BASICA' | 'COMPLEMENTARIA' | 'INVESTIGACION';
  creditos: number;           // positive integer
}
```

### UeaCatalogItem

```ts
{
  id: number;
  clave: string;
  nombre: string;
  tipo: 'OBLIGATORIA' | 'OPTATIVA';
  modalidad: 'MIXTA';
  horasTeoria: number;
  horasPractica: number;
  tipoFormacion: 'BASICA' | 'COMPLEMENTARIA' | 'INVESTIGACION';
  creditos: number;
  active: boolean;
}
```

### UeaBulkUploadResult

```ts
{
  created: number;
  errors: {
    row: number;   // 1-indexed; row 1 = first data row (row 2 in the file, row 1 is header)
    code: 'DUPLICATE_CLAVE' | 'MISSING_FIELD' | 'INVALID_CREDITS' | 'INVALID_FORMAT';
  }[];
}
```

If `errors.length > 0` → `created` must be `0`.

### Bulk Upload CSV Template

The SPA provides and validates against this exact header row:

```
Clave,NOMBRE UEA,TIPO,MODALIDAD,H. TEOR.,H. PRAC.,Tipo formacion,Creditos
```

Column mapping:

| Column | Field | Notes |
|--------|-------|-------|
| `Clave` | `clave` | required |
| `NOMBRE UEA` | `nombre` | required |
| `TIPO` | `tipo` | `OBLIGATORIA` or `OPTATIVA` (case-insensitive) |
| `MODALIDAD` | `modalidad` | always `MIXTA` |
| `H. TEOR.` | `horasTeoria` | numeric, decimals allowed |
| `H. PRAC.` | `horasPractica` | numeric, decimals allowed |
| `Tipo formacion` | `tipoFormacion` | `BASICA`, `COMPLEMENTARIA`, or `INVESTIGACION` (case-insensitive) |
| `Creditos` | `creditos` | positive integer |

The same column layout applies to `.xlsx` files (first sheet, first row = headers).

## Endpoints

### 1. List UEAs

```http
GET /api/ueas?page={page}&size={size}&search={optional}&active={optional}
```

- `search`: filters by `clave` or `nombre` (case-insensitive substring)
- `active`: `true` / `false`; omit to return all

Response — `PageResponse<UeaCatalogItem>`:

```json
{
  "content": [ /* UeaCatalogItem[] */ ],
  "totalElements": 38,
  "totalPages": 4,
  "number": 0,
  "size": 10
}
```

### 2. Register UEA

```http
POST /api/ueas
Content-Type: application/json
```

Request: `RegisterUeaRequest`

Response `201`: `UeaCatalogItem`

Expected errors:

| Status | `error` field | Condition |
|--------|---------------|-----------|
| `409` | `UEA_ALREADY_EXISTS` | `clave` already exists in this tenant |
| `400` | `VALIDATION_ERROR` | any field fails validation |

Example request:

```json
{
  "clave": "2156024",
  "nombre": "REDES Y PROTOCOLOS DE COMUNICACIONES",
  "tipo": "OBLIGATORIA",
  "modalidad": "MIXTA",
  "horasTeoria": 3,
  "horasPractica": 3,
  "tipoFormacion": "BASICA",
  "creditos": 9
}
```

### 3. Bulk upload UEAs

```http
POST /api/ueas/bulk
Content-Type: multipart/form-data
```

Field name: `file` (`.xlsx` or `.csv`)

Response `200`: `UeaBulkUploadResult`

Expected errors:

| Status | `error` field | Condition |
|--------|---------------|-----------|
| `400` | `FILE_FORMAT_INVALID` | wrong extension, unreadable file, or headers don't match template |

Row-level errors (returned inside the `200` body, not as HTTP errors):

| `code` | Condition |
|--------|-----------|
| `DUPLICATE_CLAVE` | `clave` already exists in tenant or is repeated within the file |
| `MISSING_FIELD` | `clave`, `nombre`, `tipo`, or `tipoFormacion` is blank or invalid enum |
| `INVALID_CREDITS` | `creditos` is not a positive integer |
| `INVALID_FORMAT` | row cannot be parsed (malformed CSV, merged cells in xlsx, etc.) |

Example success response:

```json
{ "created": 5, "errors": [] }
```

Example partial-error response (all-or-nothing → `created: 0`):

```json
{
  "created": 0,
  "errors": [
    { "row": 3, "code": "DUPLICATE_CLAVE" },
    { "row": 7, "code": "INVALID_CREDITS" }
  ]
}
```

## Validation Rules

### `POST /api/ueas` — field-level rules

| Field | Rule | Error code |
|-------|------|------------|
| `clave` | required, max 20 chars | `VALIDATION_ERROR` |
| `clave` | must contain only digits (`^\d+$`) | `CLAVE_INVALID_FORMAT` (400) |
| `clave` | unique within tenant | `UEA_ALREADY_EXISTS` (409) |
| `nombre` | required, max 200 chars | `VALIDATION_ERROR` |
| `tipo` | must be `OBLIGATORIA` or `OPTATIVA` | `VALIDATION_ERROR` |
| `modalidad` | must be `MIXTA` | `VALIDATION_ERROR` |
| `horasTeoria` | number ≥ 0 | `VALIDATION_ERROR` |
| `horasPractica` | number ≥ 0 | `VALIDATION_ERROR` |
| `tipoFormacion` | must be `BASICA`, `COMPLEMENTARIA`, or `INVESTIGACION` | `VALIDATION_ERROR` |
| `creditos` | positive integer (> 0, no decimals) | `VALIDATION_ERROR` |

`CLAVE_INVALID_FORMAT` gets its own code (not `VALIDATION_ERROR`) so the SPA can surface
a specific inline message even if client-side validation was bypassed.

### `POST /api/ueas/bulk` — row-level rules

Applied in order; first failing rule wins for a given row:

| Rule | `code` in response |
|------|--------------------|
| File extension not `.xlsx` or `.csv`, or file is unreadable | HTTP `400 FILE_FORMAT_INVALID` |
| Header row doesn't match template exactly | HTTP `400 FILE_FORMAT_INVALID` |
| Row has a cell that cannot be parsed | `INVALID_FORMAT` |
| `clave`, `nombre`, `tipo`, or `tipoFormacion` is blank or invalid enum value | `MISSING_FIELD` |
| `creditos` is not a positive integer | `INVALID_CREDITS` |
| `clave` already exists in tenant OR is repeated within the file | `DUPLICATE_CLAVE` |

## Error Payload Shape

```json
{
  "error": "UEA_ALREADY_EXISTS",
  "message": "A UEA with this clave already exists in this graduate program"
}
```

## Stable Error Codes Expected By SPA

| `error` | HTTP status | Displayed as |
|---------|------------|-------------|
| `UEA_ALREADY_EXISTS` | 409 | "Esta UEA ya ha sido registrada." |
| `CLAVE_INVALID_FORMAT` | 400 | "La clave debe contener solo dígitos." |
| `FILE_FORMAT_INVALID` | 400 | "Formato de archivo inválido, utilice la plantilla proporcionada." |
| `VALIDATION_ERROR` | 400 | "Ocurrió un error al guardar la información." (generic fallback) |

Row-level codes (inside `UeaBulkUploadResult.errors[].code`) shown per row in the SPA:

| `code` | Displayed as |
|--------|-------------|
| `DUPLICATE_CLAVE` | "Clave duplicada" |
| `MISSING_FIELD` | "Campo obligatorio faltante" |
| `INVALID_CREDITS` | "Créditos inválidos (debe ser entero mayor a 0)" |
| `INVALID_FORMAT` | "Formato inválido" |

## Backend Notes

1. `clave` comparison must be case-insensitive (`"2156024"` and `"2156024"` are the same; also apply to duplicate check within the bulk file before inserting).
2. For `.xlsx`, read the **first sheet**; row 1 = headers, rows 2+ = data.
3. Bulk insert must be wrapped in a single transaction — rollback everything on any row error.
4. The `row` number in errors is **1-indexed relative to data rows** (header is row 0; first data row = 1), matching what the SPA displays.
5. `X-Graduate-Id` scopes all queries — never leak UEAs across tenants.
6. Paged list responses use Spring shape: `content`, `totalElements`, `totalPages`, `number`, `size` (not `page`).
