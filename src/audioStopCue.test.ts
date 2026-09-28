import { beforeEach, describe, expect, it } from "vitest";
import { usePresentation } from "./store";
import { defaultBackgroundAudio } from "./BackgroundAudioPanel";

describe("audio stop cues", () => {
  beforeEach(() => usePresentation.getState().newDocument("Audio-Test"));

  it("removes a stop cue when new background audio is assigned to the same item", () => {
    usePresentation.getState().addItem("content");
    const itemId = usePresentation.getState().items[0].id;
    usePresentation.getState().toggleAudioStopCue(itemId);
    usePresentation.getState().updateItemAudio(
      itemId,
      defaultBackgroundAudio([{ assetId: "a", name: "Track", url: "track.mp3" }]),
    );
    const item = usePresentation.getState().items.find((entry) => entry.id === itemId);
    expect(item?.audioStopCue).toBeUndefined();
    expect(item?.backgroundAudio?.tracks).toHaveLength(1);
  });

  it('removes a section stop cue when new section audio is assigned',()=>{
    const state=usePresentation.getState();
    state.toggleSectionAudioStopCue('service');
    state.updateSectionAudio('service',defaultBackgroundAudio([{assetId:'a',name:'Track',url:'track.mp3'}]));
    const section=usePresentation.getState().sections.find(entry=>entry.id==='service');
    expect(section?.audioStopCue).toBeUndefined();
    expect(section?.backgroundAudio?.tracks).toHaveLength(1);
  });
});
