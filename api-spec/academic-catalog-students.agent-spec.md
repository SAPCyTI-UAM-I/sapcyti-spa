# Academic Catalog Student API — Agent Spec

## Goal
Implement the backend contract expected by the SPA for:

- HU-17: unified student detail
- HU-18: unified student edit
- HU-19 / HU-20: academic program detail + update
- HU-44: research catalog cascade `lineOfKnowledge -> researchArea`

This file is optimized for backend implementation by an AI agent: short, explicit, and low-noise.

## Core Rules

1. Each student has exactly **one** academic program.
2. `programType` is either `MAESTRIA` or `DOCTORADO`.
3. `enrollmentId` is read-only on edit.
4. If `status = BAJA`, then `withdrawalReason` is required.
5. If `graduationDate` exists, it must be `>= admissionDate`.
6. `researchArea` must belong to the selected `lineOfKnowledge`.
7. `advisorIds` must not contain duplicates.
8. Backend returns canonical catalog values as strings. The SPA handles translation.
9. On registration, `tutorId` and `advisorIds` are optional.
10. If provided on registration, tutor/advisor professor IDs must exist.

## Auth / Headers

Required header on all requests:

```http
X-Graduate-Id: <graduateProgramId>
```

The SPA also sends the authenticated session/cookies.

## DTOs

### RegisterStudentRequest

Required:
- `enrollmentId`
- `email`
- `graduateProgramId`
- `firstName`
- `firstLastName`
- `nationality`
- `birthDate`
- `phone`
- `undergraduateDegree`
- `lastDegreeObtained`
- `programType`
- `admissionDate`

Optional:
- `secondLastName`
- `phoneExtension`
- `lineOfKnowledge`
- `researchArea`
- `tutorId` (`null` allowed)
- `advisorIds`

```ts
{
  enrollmentId: string;
  email: string;
  graduateProgramId: number;
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  nationality: string;
  birthDate: string;        // YYYY-MM-DD
  phone: string;
  phoneExtension?: string;
  undergraduateDegree: string;
  lastDegreeObtained: string;
  programType: 'MAESTRIA' | 'DOCTORADO';
  admissionDate: string;    // YYYY-MM-DD
  lineOfKnowledge?: string;
  researchArea?: string;
  tutorId?: number | null;
  advisorIds?: number[];
}
```

### UpdateStudentRequest

Required:
- `firstName`
- `firstLastName`
- `email`
- `nationality`
- `birthDate`
- `phone`
- `undergraduateDegree`
- `lastDegreeObtained`
- `programType`
- `admissionDate`
- `active`

Optional:
- `secondLastName`
- `phoneExtension`

```ts
{
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  email: string;
  nationality: string;
  birthDate: string;
  phone: string;
  phoneExtension?: string;
  undergraduateDegree: string;
  lastDegreeObtained: string;
  programType: 'MAESTRIA' | 'DOCTORADO';
  admissionDate: string;
  active: boolean;
}
```

### UpdateStudentProgramRequest

Required:
- `admissionDate`
- `status`
- `advisorIds`

Optional:
- `graduationDate`
- `lineOfKnowledge`
- `researchArea`
- `withdrawalReason`
- `tutorId` (`null` allowed)

```ts
{
  admissionDate: string;
  graduationDate?: string;
  lineOfKnowledge?: string;
  researchArea?: string;
  status: 'ACTIVO' | 'BAJA' | 'EGRESADO';
  withdrawalReason?: string;
  tutorId?: number | null;
  advisorIds: number[];
}
```

### StudentDetailResponse

Top-level always returned:
- `id`
- `userId`
- `enrollmentId`
- `email`
- `graduateProgramId`
- `firstName`
- `firstLastName`
- `nationality`
- `birthDate`
- `phone`
- `undergraduateDegree`
- `lastDegreeObtained`
- `programType`
- `admissionDate`
- `active`
- `program`

Top-level optional:
- `secondLastName`
- `phoneExtension`

Inside `program` always returned:
- `id`
- `studentId`
- `graduateProgramId`
- `enrollmentId`
- `programType`
- `admissionDate`
- `status`
- `advisorIds`
- `advisors`

Inside `program` optional:
- `graduationDate`
- `lineOfKnowledge`
- `researchArea`
- `withdrawalReason`
- `tutorId`
- `tutor`

### StudentProgramSummary

Always returned:
- `id`
- `programType`
- `enrollmentId`
- `status`
- `hasTutor`

Optional:
- `tutorId`

### ProfessorCatalogItem

Always returned:
- `id`
- `userId`
- `employeeNumber`
- `email`
- `graduateProgramId`
- `firstName`
- `firstLastName`
- `phone`
- `commissionMember`
- `active`

Optional:
- `secondLastName`
- `phoneExtension`
- `nextSabbaticalStart`
- `nextSabbaticalEnd`

### ResearchAreaCatalogItem

Always returned:
- `line`
- `areas`

Optional:
- none

## Endpoints

### 1. List students

```http
GET /api/students?page={page}&size={size}&search={optional}&programType={optional}&active={optional}
```

Purpose:
- student catalog list
- filters by text, `programType`, and `active`

Response:
- paged `StudentCatalogItem`

### 2. Register student

```http
POST /api/students
```

Request:
- `RegisterStudentRequest`

Response:
- `RegisterStudentResponse`

Expected errors:
- `409` duplicate email
- `409` duplicate enrollment
- `404` graduate program not found
- `404` professor not found
- `400` validation (HU-44 cascade, duplicate advisors)

Example request:

```json
{
  "enrollmentId": "223300999",
  "email": "new.student@uam.mx",
  "graduateProgramId": 1,
  "firstName": "Nueva",
  "firstLastName": "Alumna",
  "nationality": "Mexicana",
  "birthDate": "1999-01-15",
  "phone": "5510002000",
  "undergraduateDegree": "Computación",
  "lastDegreeObtained": "Licenciatura en Computación",
  "programType": "MAESTRIA",
  "admissionDate": "2026-09-01",
  "lineOfKnowledge": "Ciencias e Ingeniería de la Computación",
  "researchArea": "Inteligencia artificial",
  "tutorId": 10,
  "advisorIds": [11]
}
```

### 3. Get unified student detail

```http
GET /api/students/{studentId}
```

Purpose:
- student detail screen
- includes personal data + the single academic program

Response:
- `StudentDetailResponse`

Expected errors:
- `404` student not found

### 4. Update unified student data

```http
PUT /api/students/{studentId}
```

Purpose:
- update personal/student-level fields from the unified edit screen

Request:
- `UpdateStudentRequest`

Important:
- `enrollmentId` is not sent on update

Response:
- updated `StudentCatalogItem`

Expected errors:
- `404` student not found
- `409` duplicate email
- `400` validation

### 5. List student programs

```http
GET /api/students/{studentId}/programs
```

Purpose:
- data-layer support
- current SPA expects exactly **one** item in the list

Response:
- `StudentProgramSummary[]`

### 6. Get student program detail

```http
GET /api/students/{studentId}/programs/{programId}
```

Purpose:
- program-level access
- still useful even with unified detail/edit

Response:
- `StudentProgramResponse`

Expected errors:
- `404` program not found

### 7. Update student program

```http
PUT /api/students/{studentId}/programs/{programId}
```

Purpose:
- update program metadata, tutor, advisors, and HU-44 catalog fields

Request:
- `UpdateStudentProgramRequest`

Expected errors:
- `404` student program not found
- `404` professor not found
- `400` validation

Example request:

```json
{
  "admissionDate": "2025-09-01",
  "lineOfKnowledge": "Ciencias e Ingeniería de la Computación",
  "researchArea": "Inteligencia artificial",
  "status": "ACTIVO",
  "tutorId": 10,
  "advisorIds": [11]
}
```

### 8. List professors

```http
GET /api/professors?page={page}&size={size}&search={optional}&active={optional}
```

Purpose:
- populate tutor and advisor selectors

Response:
- paged `ProfessorCatalogItem`

### 9. Research catalog

```http
GET /api/research-catalog
```

Purpose:
- provide canonical HU-44 hierarchy

Response:
- `ResearchAreaCatalogItem[]`

Example response:

```json
[
  {
    "line": "Ciencias e Ingeniería de la Computación",
    "areas": [
      "Supercómputo (cómputo de alto rendimiento)",
      "Manejo de datos masivos (Big data)",
      "Web semántica",
      "Internet de las cosas",
      "Inteligencia artificial"
    ]
  },
  {
    "line": "Redes de Comunicaciones",
    "areas": [
      "Comunicaciones inalámbricas",
      "Aplicaciones de redes",
      "Redes definidas por software",
      "Codificación de red",
      "Encaminamiento (ruteo)",
      "Procesamiento digital de señales en las comunicaciones"
    ]
  }
]
```

## Error Payload Shape

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Withdrawal reason is required when status is BAJA"
}
```

## Stable Error Messages Expected By SPA

- `A user with this email already exists`
- `A student with this enrollment ID already exists`
- `Graduate program not found`
- `Student not found`
- `Student program not found`
- `Professor not found`
- `Graduation date must be on or after admission date`
- `Withdrawal reason is required when status is BAJA`
- `Duplicate advisor IDs are not allowed`

## Backend Notes

1. Return canonical catalog values as strings, not ids.
2. `GET /students/{studentId}` must embed the single `program`.
3. `/students/{studentId}/programs` may remain as a list endpoint, but it should effectively contain one program per student for current business rules.
