export type ModuleStatus = "Yet to Start" | "Progressing" | "Completed";

export interface PortalConfig {
  progressBar: number;
  controlCenterWeb: ModuleStatus;
  controlCenterWebProgress: number;
  sellerPortalWeb: ModuleStatus;
  sellerPortalWebProgress: number;
  mainAppAndroid: ModuleStatus;
  mainAppAndroidProgress: number;
  partnerAppAndroid: ModuleStatus;
  partnerAppAndroidProgress: number;
  estimatedDeliveryDate: string;
}
