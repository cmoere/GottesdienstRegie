# Deutsche Offline-Sprachausgabe / Bundled German speech

Powered by MaryTTS (DFKI), https://github.com/marytts/marytts, version 5.2.1, LGPL-3.0.
German voice: dfki-pavoque-neutral 5.2, recorded PAVOQUE corpus, DFKI, CC BY-ND 3.0.
The voice archive and its data are redistributed unmodified.
https://github.com/marytts/voice-dfki-pavoque-neutral

Private runtime: Eclipse Temurin OpenJDK 17, GPL-2.0 with Classpath Exception and
additional third-party notices in runtime/legal. The pinned version and original
binary URL for this platform are recorded in manifest.json. Corresponding source
archives are provided with the binary at the respective Temurin GitHub release:
https://github.com/adoptium/temurin17-binaries/releases

Exact corresponding OpenJDK source downloads (select the version in manifest.json):
- Windows/macOS x64, 17.0.20.1+1:
  https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.20.1%2B1/OpenJDK17U-jdk-sources_17.0.20.1_1.tar.gz
- Linux x64/macOS arm64, 17.0.21+9:
  https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.21%2B9/OpenJDK17U-jdk-sources_17.0.21_9.tar.gz

MaryTTS and LGPL component source archives, their licenses and third-party notices
are included in licenses/. MaryTTS source also remains available at
https://github.com/marytts/marytts/tree/v5.2.1 .

These components retain their respective licenses. The application's proprietary
terms do not restrict the rights granted by these licenses, including replacing
the separately distributed LGPL libraries with compatible modified versions and
debugging such modifications. The Java worker source is included in worker/.
No system Java installation or system speech voice is used. Speech synthesis runs
locally. Only GottesdienstRegie's configured audio player emits audible sound.
