export type DeviceType =
  | "blender"
  | "coffee_machine"
  | "desk_lamp"
  | "fan"
  | "hair_dryer"
  | "iron"
  | "laptop"
  | "microwave"
  | "phone"
  | "robot_vacuum"
  | "smartwatch"
  | "washing_machine"
  | "rice_cooker"
  | "kettle"
  | "oven"
  | "vacuum"
  | "dishwasher"
  | "tv"
  | "speakers"
  | "radio";

export type FrequencyOption =
  | "rarely"
  | "sometimes"
  | "everyday"
  | "constantly";

export type DeviceResponse = {
  like?: number;
  frequency?: FrequencyOption;
  helpPercent?: number;
  easeOfUse?: number;
};

export type OnboardingState = {
  userName: string;
  selectedDevices: DeviceType[];
  deviceResponses: Record<DeviceType, DeviceResponse>;
  favorite?: DeviceType;
  replaceRanking: DeviceType[];
  essentialRanking: DeviceType[];
  neverReplace: DeviceType[];
};
