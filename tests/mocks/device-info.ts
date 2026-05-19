export async function getTotalMemory() {
  return 4 * 1024 * 1024 * 1024; // 4GB
}

export async function getFreeDiskStorage() {
  return 10 * 1024 * 1024 * 1024; // 10GB
}

export async function getTotalDiskStorage() {
  return 32 * 1024 * 1024 * 1024; // 32GB
}

export async function getBatteryLevel() {
  return 0.8;
}

export async function isBatteryCharging() {
  return true;
}

export async function getProcessorCount() {
  return 4;
}

export default {
  getTotalMemory,
  getFreeDiskStorage,
  getTotalDiskStorage,
  getBatteryLevel,
  isBatteryCharging,
  getProcessorCount,
};
