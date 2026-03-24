export interface RequestContextStore {
  requestId: string;
  method: string;
  path: string;
  startAt: number;
  projectCode?: string;
}
