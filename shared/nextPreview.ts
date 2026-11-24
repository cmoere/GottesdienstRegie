/** Common metadata keeps the native process independent of the renderer store. */
export interface PreviewSlide {
  id: string;
  title: string;
  body: string;
  sourceSlideId?: string;
}

export interface NextPreviewPacket<TSlide extends PreviewSlide = PreviewSlide> {
  slide: TSlide;
  sourceHash?: string;
  itemTitle?: string;
}

export interface NextPreviewState<TSlide extends PreviewSlide = PreviewSlide> {
  revision: number;
  packet: NextPreviewPacket<TSlide> | null;
  packets: NextPreviewPacket<TSlide>[];
}
