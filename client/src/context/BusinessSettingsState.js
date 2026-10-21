import { createContext, useContext } from "react";
export const BusinessSettingsContext = createContext(null);
export function useBusinessSettings() {
  const context =
    useContext(
      BusinessSettingsContext
    );

  if (!context) {
    throw new Error(
      "useBusinessSettings must be used inside BusinessSettingsProvider"
    );
  }

  return context;
}