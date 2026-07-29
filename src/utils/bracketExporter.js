/**
 * Native Browser Export Utility
 * Opens browser print/PDF export dialog formatted for tournament schedules & brackets.
 */

export function exportElementAsImage(elementId, filename = "pixel-palace-schedule.pdf") {
  try {
    window.print();
  } catch (err) {
    console.error("Print export failed:", err);
  }
}
