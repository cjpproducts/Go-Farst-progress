export type ModuleStatus = "Yet to Start" | "Progressing" | "Completed";

export interface PortalConfig {
  progressBar: number;
  controlCenterWeb: ModuleStatus;
  sellerPortalWeb: ModuleStatus;
  mainAppAndroid: ModuleStatus;
  partnerAppAndroid: ModuleStatus;
  estimatedDeliveryDate: string;
}
