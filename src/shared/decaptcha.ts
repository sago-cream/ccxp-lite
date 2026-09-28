(function registerCcxpLiteDecaptchaShared() {
  globalThis.CCXP_LITE ??= {};
  const namespace = globalThis.CCXP_LITE;

  function createTensor(
    shape: readonly number[],
    data: Float32Array | ArrayLike<number>,
  ): CcxpLitePreparedTensor {
    return {
      shape: [...shape],
      data: data instanceof Float32Array ? data : new Float32Array(data),
    };
  }

  function tensorGet(tensor: CcxpLitePreparedTensor, indices: readonly number[]) {
    let flatIndex = 0;
    let stride = 1;
    for (let axis = tensor.shape.length - 1; axis >= 0; axis--) {
      flatIndex += indices[axis] * stride;
      stride *= tensor.shape[axis];
    }
    return tensor.data[flatIndex];
  }

  function decodeImageElement(image: HTMLImageElement) {
    const width = image.naturalWidth > 0 ? image.naturalWidth : image.width;
    const height = image.naturalHeight > 0 ? image.naturalHeight : image.height;
    const canvas =
      typeof OffscreenCanvas === "undefined"
        ? globalThis.document.createElement("canvas")
        : new OffscreenCanvas(width, height);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true }) as
      | OffscreenCanvasRenderingContext2D
      | CanvasRenderingContext2D
      | null;
    if (!context) {
      throw new Error("Failed to create 2d canvas context.");
    }
    context.drawImage(image, 0, 0);
    return {
      width,
      height,
      data: context.getImageData(0, 0, width, height).data,
    };
  }

  function conv2d(
    inputTensor: CcxpLitePreparedTensor,
    weight: CcxpLitePreparedTensor,
    bias?: CcxpLitePreparedTensor,
    options: {
      stride?: number;
      padding?: number;
      groups?: number;
    } = {},
  ) {
    const stride = options.stride ?? 1;
    const padding = options.padding ?? 0;
    const groups = options.groups ?? 1;
    const [, inHeight, inWidth] = inputTensor.shape;
    const [outChannels, channelsPerGroup, kernelHeight, kernelWidth] = weight.shape;
    const outHeight = Math.floor((inHeight + 2 * padding - kernelHeight) / stride) + 1;
    const outWidth = Math.floor((inWidth + 2 * padding - kernelWidth) / stride) + 1;
    const out = new Float32Array(outChannels * outHeight * outWidth);
    const outChannelsPerGroup = outChannels / groups;
    function convolvePixel(
      outChannel: number,
      inputChannelOffset: number,
      inY0: number,
      inX0: number,
    ) {
      let acc = bias ? bias.data[outChannel] : 0;
      const firstY = Math.max(0, -inY0);
      const lastY = Math.min(kernelHeight, inHeight - inY0);
      const firstX = Math.max(0, -inX0);
      const lastX = Math.min(kernelWidth, inWidth - inX0);
      for (let channelIndex = 0; channelIndex < channelsPerGroup; channelIndex++) {
        const inputChannel = inputChannelOffset + channelIndex;
        for (let kernelY = firstY; kernelY < lastY; kernelY++) {
          const inY = inY0 + kernelY;
          for (let kernelX = firstX; kernelX < lastX; kernelX++) {
            const inX = inX0 + kernelX;
            acc +=
              tensorGet(inputTensor, [inputChannel, inY, inX]) *
              tensorGet(weight, [outChannel, channelIndex, kernelY, kernelX]);
          }
        }
      }
      return acc;
    }
    let outIndex = 0;
    for (let outChannel = 0; outChannel < outChannels; outChannel++) {
      const groupIndex = Math.floor(outChannel / outChannelsPerGroup);
      const inputChannelOffset = groupIndex * channelsPerGroup;
      for (let outY = 0; outY < outHeight; outY++) {
        for (let outX = 0; outX < outWidth; outX++) {
          out[outIndex] = convolvePixel(
            outChannel,
            inputChannelOffset,
            outY * stride - padding,
            outX * stride - padding,
          );
          outIndex++;
        }
      }
    }
    return createTensor([outChannels, outHeight, outWidth], out);
  }

  namespace.decaptchaShared = { createTensor, tensorGet, decodeImageElement, conv2d };
})();
