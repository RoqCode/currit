import { getTodayBounds } from "./getTodayBounds";

export function getCandidateWindow(daysBack: number = 1) {
  // min 1
  if (daysBack < 1) {
    console.warn(
      "Candidate window is too small! Set Values between 1-4. Defaulting to 1",
    );
    daysBack = 1;
  }

  const startOfWindow = new Date();
  startOfWindow.setHours(0, 0, 0, 0);
  startOfWindow.setDate(startOfWindow.getDate() - daysBack + 1);

  return {
    startOfWindow,
    feedDateRange:
      daysBack <= 1
        ? startOfWindow.toISOString().slice(0, 10)
        : `${startOfWindow.toISOString().slice(0, 10)} - ${getTodayBounds().feedDate}`,
  };
}
