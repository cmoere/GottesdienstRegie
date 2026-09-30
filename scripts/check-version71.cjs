const fs = require("fs"),
  assert = require("assert");
const read = (file) => fs.readFileSync(file, "utf8"),
  pkg = require("../package.json"),
  releases = require("../public/releases.json"),
  notes = read("RELEASE_NOTES.md"),
  workflow = read(".github/workflows/release.yml"),
  events = read("src/dynamicEventSlide.ts"),
  live = read("src/liveDynamicData.ts"),
  renderer = read("src/SlideRenderer.tsx"),
  designer = read("src/EventSlideDesigner.tsx"),
  nowPlaying = read("src/nowPlayingModel.ts");
assert(
  pkg.version.startsWith("0.71.") && pkg.releaseSeries === "0.71",
  "package must identify V71",
);
assert(
  releases.versions[0]?.builds.some((build) => build.version === "0.71.0") &&
    releases.versions[0].builds[0].current === true,
  "V71 must lead the release catalog",
);
assert(
  notes.includes("# GottesdienstRegie 0.71.0"),
  "notes must start with V71",
);
assert(workflow.includes("check-version71.cjs"), "workflow must run V71 guard");
assert(
  events.includes("EVENT_SLIDE_DESIGNS") &&
    events.includes("setLatestPublicEvents"),
  "multiple event designs or snapshot missing",
);
assert(
  live.includes("eventItemsJson") && renderer.includes("event-loop-list"),
  "MAIN event hydration missing",
);
assert(designer.includes("event-design-cards"), "event design chooser missing");
assert(nowPlaying.includes("roundArtwork"), "round artwork option missing");
console.log("V71 release guard passed.");
