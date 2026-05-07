import { DeviceResponse, DeviceType, OnboardingState } from "@/lib/survey/types";

type DeviceDefinition = {
  id: DeviceType;
  label: string;
  shortLabel: string;
  imagePath: string;
};

export const DEVICE_DEFINITIONS: DeviceDefinition[] = [
  {
    id: "blender",
    label: "Blender",
    shortLabel: "blender",
    imagePath: "/devices/v2/blender.png",
  },
  {
    id: "coffee_machine",
    label: "Coffee machine",
    shortLabel: "coffee",
    imagePath: "/devices/v2/coffeemachine.png",
  },
  {
    id: "desk_lamp",
    label: "Desk lamp",
    shortLabel: "lamp",
    imagePath: "/devices/v2/desklamp.png",
  },
  {
    id: "fan",
    label: "Fan",
    shortLabel: "fan",
    imagePath: "/devices/v2/fan.png",
  },
  {
    id: "hair_dryer",
    label: "Hair dryer",
    shortLabel: "dryer",
    imagePath: "/devices/v2/hairdryer.png",
  },
  {
    id: "iron",
    label: "Iron",
    shortLabel: "iron",
    imagePath: "/devices/v2/iron.png",
  },
  {
    id: "laptop",
    label: "Laptop",
    shortLabel: "laptop",
    imagePath: "/devices/v2/laptop.png",
  },
  {
    id: "microwave",
    label: "Microwave",
    shortLabel: "microwave",
    imagePath: "/devices/v2/microwave.png",
  },
  {
    id: "phone",
    label: "Phone",
    shortLabel: "phone",
    imagePath: "/devices/v2/phone.png",
  },
  {
    id: "robot_vacuum",
    label: "Robot vacuum",
    shortLabel: "robot vac",
    imagePath: "/devices/v2/robotvacuum.png",
  },
  {
    id: "smartwatch",
    label: "Smartwatch",
    shortLabel: "watch",
    imagePath: "/devices/v2/smartwatch.png",
  },
  {
    id: "washing_machine",
    label: "Washing machine",
    shortLabel: "washer",
    imagePath: "/devices/v2/washer.png",
  },
  {
    id: "rice_cooker",
    label: "Rice cooker",
    shortLabel: "cooker",
    imagePath: "/devices/v2/ricecooker.png",
  },
  {
    id: "kettle",
    label: "Kettle",
    shortLabel: "kettle",
    imagePath: "/devices/v2/kettle.png",
  },
  {
    id: "oven",
    label: "Oven",
    shortLabel: "oven",
    imagePath: "/devices/v2/oven.png",
  },
  {
    id: "vacuum",
    label: "Vacuum cleaner",
    shortLabel: "vacuum",
    imagePath: "/devices/v2/vacuumcleaner.png",
  },
  {
    id: "dishwasher",
    label: "Dishwasher",
    shortLabel: "dishwasher",
    imagePath: "/devices/v2/dishwasher.png",
  },
  {
    id: "tv",
    label: "TV",
    shortLabel: "tv",
    imagePath: "/devices/v2/tv.png",
  },
  {
    id: "speakers",
    label: "Speakers",
    shortLabel: "speakers",
    imagePath: "/devices/v2/speakers.png",
  },
  {
    id: "radio",
    label: "Radio",
    shortLabel: "radio",
    imagePath: "/devices/v2/radio.png",
  },
];

export const DEVICE_IDS = DEVICE_DEFINITIONS.map((device) => device.id);

export function getDeviceDefinition(device: DeviceType) {
  return DEVICE_DEFINITIONS.find((entry) => entry.id === device)!;
}

export function createInitialState(): OnboardingState {
  const deviceResponses = DEVICE_DEFINITIONS.reduce<Record<DeviceType, DeviceResponse>>(
    (accumulator, device) => {
      accumulator[device.id] = {};
      return accumulator;
    },
    {} as Record<DeviceType, DeviceResponse>,
  );

  return {
    userName: "",
    selectedDevices: [],
    deviceResponses,
    replaceRanking: [],
    essentialRanking: [],
    neverReplace: [],
  };
}

export function moveItem<T>(list: T[], from: number, to: number) {
  const clone = [...list];
  const [item] = clone.splice(from, 1);
  clone.splice(to, 0, item);
  return clone;
}
