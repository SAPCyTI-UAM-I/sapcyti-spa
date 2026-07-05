export type UeaTipo = 'OBLIGATORIA' | 'OPTATIVA';
export type UeaModalidad = 'MIXTA';
export type UeaTipoFormacion = 'BASICA' | 'COMPLEMENTARIA' | 'INVESTIGACION';

export interface RegisterUeaRequest {
  clave: string;
  nombre: string;
  tipo: UeaTipo;
  modalidad: UeaModalidad;
  horasTeoria: number;
  horasPractica: number;
  tipoFormacion: UeaTipoFormacion;
  creditos: number;
}

export interface UeaCatalogItem extends RegisterUeaRequest {
  id: number;
  active: boolean;
}

/** HU-47: edit payload — same fields as register minus the immutable `clave`. */
export type UpdateUeaRequest = Omit<RegisterUeaRequest, 'clave'>;

export interface UeaCatalogQuery {
  page: number;
  size: number;
  search?: string;
  active?: boolean;
}

export type BulkErrorCode =
  | 'DUPLICATE_CLAVE'
  | 'MISSING_FIELD'
  | 'INVALID_CREDITS'
  | 'INVALID_FORMAT';

export interface UeaBulkUploadResult {
  created: number;
  errors: { row: number; code: BulkErrorCode }[];
}
