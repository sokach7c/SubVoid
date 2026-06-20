import type {
  ConverterForm,
  CustomConverterParam,
} from "@/lib/subconverter/types";
import { validateConverterForm } from "@/lib/subconverter/validators";

export function createDefaultConverterForm(): ConverterForm {
  return {
    sourceSubUrl: "",
    clientType: "clash",
    customBackend: "",
    remoteConfig: "",
    excludeRemarks: "",
    includeRemarks: "",
    filename: "",
    emoji: true,
    nodeList: false,
    sort: false,
    udp: false,
    tfo: false,
    scv: true,
    fdn: false,
    expand: true,
    appendType: false,
    insert: false,
    newName: true,
    tpl: {
      surge: { doh: false },
      clash: { doh: false },
    },
  };
}

export function processSubUrl(url: string): string {
  return url.replace(/(\n|\r|\n\r)/g, "|");
}

export function makeSubscriptionUrl(options: {
  form: ConverterForm;
  advanced: boolean;
  backend: string;
  customParams: CustomConverterParam[];
  needUdp: boolean;
}): string {
  const { form, advanced, backend, customParams, needUdp } = options;

  if (!validateConverterForm(form)) {
    return "";
  }

  let customSubUrl = buildBaseUrl(form, processSubUrl(form.sourceSubUrl), backend);

  if (advanced) {
    customSubUrl += buildAdvancedParams(form, customParams, needUdp);
  }

  return customSubUrl;
}

export function buildBaseUrl(
  form: ConverterForm,
  processedSubUrl: string,
  currentBackend: string
): string {
  return (
    currentBackend +
    "target=" +
    form.clientType +
    "&url=" +
    encodeURIComponent(processedSubUrl) +
    "&insert=" +
    form.insert.toString()
  );
}

export function buildAdvancedParams(
  form: ConverterForm,
  customParams: CustomConverterParam[],
  needUdp: boolean
): string {
  let params = "";

  if (form.remoteConfig) {
    params += "&config=" + encodeURIComponent(form.remoteConfig);
  }

  if (form.excludeRemarks) {
    params += "&exclude=" + encodeURIComponent(form.excludeRemarks);
  }

  if (form.includeRemarks) {
    params += "&include=" + encodeURIComponent(form.includeRemarks);
  }

  if (form.filename) {
    params += "&filename=" + encodeURIComponent(form.filename);
  }

  if (form.appendType) {
    params += "&append_type=" + form.appendType.toString();
  }

  params += buildBooleanParams(form);

  if (needUdp) {
    params += "&udp=" + form.udp.toString();
  }

  params += buildTemplateParams(form);
  params += buildCustomParams(customParams);

  return params;
}

function buildBooleanParams(form: ConverterForm): string {
  return (
    "&emoji=" +
    form.emoji.toString() +
    "&list=" +
    form.nodeList.toString() +
    "&tfo=" +
    form.tfo.toString() +
    "&scv=" +
    form.scv.toString() +
    "&fdn=" +
    form.fdn.toString() +
    "&expand=" +
    form.expand.toString() +
    "&sort=" +
    form.sort.toString()
  );
}

function buildTemplateParams(form: ConverterForm): string {
  let params = "";

  if (form.tpl.surge.doh) {
    params += "&surge.doh=true";
  }

  if (form.clientType === "clash") {
    if (form.tpl.clash.doh) {
      params += "&clash.doh=true";
    }
    params += "&new_name=" + form.newName.toString();
  }

  return params;
}

function buildCustomParams(customParams: CustomConverterParam[]): string {
  return customParams
    .filter((param) => param.name && param.value)
    .map(
      (param) =>
        `&${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`
    )
    .join("");
}
