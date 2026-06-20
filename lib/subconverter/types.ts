export interface ConverterForm {
  sourceSubUrl: string;
  clientType: string;
  customBackend: string;
  remoteConfig: string;
  excludeRemarks: string;
  includeRemarks: string;
  filename: string;
  emoji: boolean;
  nodeList: boolean;
  sort: boolean;
  udp: boolean;
  tfo: boolean;
  scv: boolean;
  fdn: boolean;
  expand: boolean;
  appendType: boolean;
  insert: boolean;
  newName: boolean;
  tpl: {
    surge: {
      doh: boolean;
    };
    clash: {
      doh: boolean;
    };
  };
}

export interface CustomConverterParam {
  name: string;
  value: string;
}

export interface RemoteConfig {
  id: string;
  groupName: string;
  label: string;
  url: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RemoteConfigInput {
  groupName: string;
  label: string;
  url: string;
  enabled: boolean;
  sortOrder: number;
}

export interface RemoteConfigGroup {
  label: string;
  options: RemoteConfig[];
}
