import {
  Snowflake,
  Package,
  Settings,
  Fan,
} from "lucide-react";

export const products = [
  {
    id: "split-ac-15hp",
    name: "1.5HP Inverter Split AC",
    category: "Air Conditioners",
    price: 4850,
    oldPrice: 5200,
    stock: 8,
    icon: Snowflake,
    badge: "Popular",
    shortDescription:
      "Energy-efficient split air conditioner suitable for bedrooms, offices and medium-sized rooms.",
    description:
      "A reliable inverter split air-conditioning system designed to provide efficient cooling while helping reduce energy consumption.",
    specifications: [
      "1.5HP cooling capacity",
      "Inverter technology",
      "Residential and office use",
      "Remote control included",
      "Professional installation available",
    ],
  },

  {
    id: "split-ac-20hp",
    name: "2.0HP Split Air Conditioner",
    category: "Air Conditioners",
    price: 5900,
    oldPrice: null,
    stock: 6,
    icon: Snowflake,
    badge: null,
    shortDescription:
      "Powerful cooling solution for larger bedrooms, offices and living spaces.",
    description:
      "A dependable 2.0HP split air conditioner built for stronger cooling performance in medium to large indoor spaces.",
    specifications: [
      "2.0HP cooling capacity",
      "Remote control included",
      "Suitable for medium and large rooms",
      "Residential and commercial use",
      "Installation service available",
    ],
  },

  {
    id: "standing-ac",
    name: "Floor Standing Air Conditioner",
    category: "Air Conditioners",
    price: 8900,
    oldPrice: 9500,
    stock: 3,
    icon: Snowflake,
    badge: "Commercial",
    shortDescription:
      "High-capacity floor standing AC for offices, halls, shops and commercial spaces.",
    description:
      "A strong cooling system designed for larger environments where higher-capacity air conditioning is required.",
    specifications: [
      "High cooling capacity",
      "Floor standing design",
      "Suitable for commercial spaces",
      "Remote operation",
      "Professional installation available",
    ],
  },

  {
    id: "ac-compressor",
    name: "AC Compressor",
    category: "Spare Parts",
    price: 1450,
    oldPrice: null,
    stock: 10,
    icon: Settings,
    badge: null,
    shortDescription:
      "Replacement compressor for compatible air-conditioning systems.",
    description:
      "A replacement AC compressor suitable for servicing and repairing compatible cooling systems.",
    specifications: [
      "Replacement component",
      "For compatible AC systems",
      "Professional fitting recommended",
      "Suitable for repair work",
    ],
  },

  {
    id: "fan-motor",
    name: "AC Fan Motor",
    category: "Spare Parts",
    price: 480,
    oldPrice: null,
    stock: 14,
    icon: Fan,
    badge: null,
    shortDescription:
      "Replacement fan motor for supported indoor and outdoor AC units.",
    description:
      "A replacement fan motor designed for compatible air-conditioning systems.",
    specifications: [
      "Replacement fan motor",
      "Indoor/outdoor applications",
      "Professional installation recommended",
    ],
  },

  {
    id: "ac-capacitor",
    name: "AC Capacitor",
    category: "Spare Parts",
    price: 120,
    oldPrice: null,
    stock: 22,
    icon: Package,
    badge: null,
    shortDescription:
      "Replacement capacitor for compatible air-conditioning units.",
    description:
      "An AC replacement capacitor suitable for servicing and repair applications.",
    specifications: [
      "Replacement component",
      "Different capacities available",
      "Technician fitting recommended",
    ],
  },

  {
    id: "ac-remote",
    name: "Universal AC Remote",
    category: "Accessories",
    price: 150,
    oldPrice: null,
    stock: 20,
    icon: Package,
    badge: null,
    shortDescription:
      "Universal replacement remote control for compatible AC brands.",
    description:
      "A convenient universal remote designed to work with several compatible air-conditioning systems.",
    specifications: [
      "Universal compatibility",
      "Easy setup",
      "Battery powered",
      "Replacement remote",
    ],
  },

  {
    id: "copper-pipe",
    name: "AC Copper Pipe Set",
    category: "Accessories",
    price: 350,
    oldPrice: null,
    stock: 18,
    icon: Package,
    badge: null,
    shortDescription:
      "Copper piping for AC installation and replacement work.",
    description:
      "Copper piping suitable for compatible residential and commercial air-conditioning installations.",
    specifications: [
      "Installation accessory",
      "Suitable for split AC systems",
      "Professional fitting recommended",
    ],
  },
];

export const productCategories = [
  "All",
  "Air Conditioners",
  "Spare Parts",
  "Accessories",
];