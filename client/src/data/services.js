import {
  Snowflake,
  Wrench,
  ShieldCheck,
  Search,
  Package,
  Building2,
} from "lucide-react";

export const services = [
  {
    id: "installation",
    title: "AC Installation",
    shortDescription:
      "Professional installation for residential and commercial air-conditioning systems.",
    description:
      "Get your air conditioner installed correctly for better performance, efficiency and long-term reliability.",
    icon: Snowflake,
    features: [
      "Split AC installation",
      "Standing AC installation",
      "Commercial AC installation",
      "Indoor and outdoor unit setup",
      "Drainage setup",
      "Electrical connection checks",
    ],
  },
  {
    id: "repairs",
    title: "AC Repairs",
    shortDescription:
      "Reliable diagnosis and repairs for common and complex AC problems.",
    description:
      "Our repair service helps identify faults and restore your air-conditioning system to proper working condition.",
    icon: Wrench,
    features: [
      "AC not cooling",
      "Water leakage",
      "Electrical faults",
      "Compressor issues",
      "Fan motor problems",
      "Remote and control problems",
    ],
  },
  {
    id: "maintenance",
    title: "Servicing & Maintenance",
    shortDescription:
      "Keep your AC clean, efficient and performing properly.",
    description:
      "Regular maintenance helps improve cooling performance, reduce breakdowns and extend the life of your AC system.",
    icon: ShieldCheck,
    features: [
      "Filter cleaning",
      "Drain cleaning",
      "Coil cleaning",
      "Performance checks",
      "Gas inspection",
      "Preventive maintenance",
    ],
  },
  {
    id: "diagnosis",
    title: "AC Diagnosis",
    shortDescription:
      "Professional inspection to identify AC faults before repair work begins.",
    description:
      "Not sure what is wrong with your AC? Our diagnosis service helps determine the cause before repairs are recommended.",
    icon: Search,
    features: [
      "Cooling inspection",
      "Electrical checks",
      "Compressor inspection",
      "Leak detection",
      "Fan inspection",
      "Repair recommendation",
    ],
  },
  {
    id: "spare-parts",
    title: "AC Spare Parts",
    shortDescription:
      "Quality replacement parts and accessories for different AC systems.",
    description:
      "We provide essential AC spare parts and accessories for repairs, replacements and installations.",
    icon: Package,
    features: [
      "Compressors",
      "Capacitors",
      "Fan motors",
      "AC remotes",
      "Copper pipes",
      "Filters and accessories",
    ],
  },
  {
    id: "commercial",
    title: "Commercial AC Solutions",
    shortDescription:
      "Cooling solutions for offices, shops, institutions and commercial spaces.",
    description:
      "We support businesses with installation, repairs and maintenance for commercial air-conditioning systems.",
    icon: Building2,
    features: [
      "Office installations",
      "Shop cooling systems",
      "Multi-unit installation",
      "Maintenance planning",
      "Commercial repairs",
      "System inspection",
    ],
  },
];