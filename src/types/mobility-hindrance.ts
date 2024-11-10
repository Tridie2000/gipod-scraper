interface LastModifiedBy {
  preferredName: string;
}

interface CreatedBy {
  preferredName: string;
}

interface Identifier {
  type: string;
  'Identifier.identifier': any[]; // Replace `any` with the appropriate type if known
  assignedByName: string;
}

interface Status {
  id: string;
  prefLabel: string;
}

interface Owner {
  type: string;
  isVersionOf: string;
  preferredName: string;
}

interface Period {
  type: string;
  end: string; // ISO 8601 date string
  start: string; // ISO 8601 date string
}

interface Zone {
  id: string;
  type: string;
  geometry: Geometry;
  zoneType: any[]; // Replace `any` with the appropriate type if known
  consequence?: Consequence;
}

interface Geometry {
  type: string;
  wkt: string;
}

interface Consequence {
  id: string;
  prefLabel: string;
}

interface GipodId {
  type: string;
  value: string;
}

export interface MobilityHindrance {
  id: string;
  type: string;
  lastModifiedBy: LastModifiedBy;
  createdBy: CreatedBy;
  createdOn: string; // ISO 8601 date string
  description: string;
  isVersionOf: string;
  lastModifiedOn: string; // ISO 8601 date string
  identifier: Identifier[];
  eventName: string;
  generatedAtTime: string; // ISO 8601 date string
  status: Status;
  owner: Owner;
  period: Period[];
  zone: Zone[];
  gipodId: GipodId;
}
