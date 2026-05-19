export const Platform = { OS: 'web' };

export const Dimensions = {
  get: (_: string) => ({ width: 1024, height: 768, scale: 1 }),
};

export const PixelRatio = {
  get: () => 1,
};

export const NativeModules = {
  BlobModule: {
    BLOB_URI_SCHEME: 'file',
  },
};

export default {
  Platform,
  Dimensions,
  PixelRatio,
  NativeModules,
};
