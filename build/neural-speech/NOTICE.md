# Mitgelieferte lokale Ansagenstimmen

Piper 1.8.0 erzeugt die Stimme lokal; kein Text wird an einen Sprachdienst gesendet.
Die getrennte Sprachkomponente einschließlich Worker steht unter GPL-3.0-or-later.
Upstream: https://github.com/OHF-Voice/piper1-gpl/tree/v1.8.0
Die Paketverzeichnisse enthalten die Lizenztexte der mitgelieferten Bibliotheken.

Stimmen: Thorsten (high, 22.050 Hz), Kerstin (low, 16.000 Hz), Karlsson und
Ramona (low, 16.000 Hz) sowie Eva K. (x_low, 16.000 Hz).
Die jeweiligen MODEL_CARD-Dateien nennen Datensatz und Freigabe. Thorsten und
Kerstin nennen CC0. Karlsson, Ramona und Eva K. beruhen auf M-AILABS; dessen
Weitergabebedingungen und Hinweise sind vollständig in source/M-AILABS-README.md
enthalten. Die dort genannten Personen unterstützen oder empfehlen dieses
Produkt dadurch nicht. Die Originalhinweise bleiben im Paket erhalten.
Modelle: https://huggingface.co/rhasspy/piper-voices

Private CPython-Laufzeit: python-build-standalone 20261021, CPython 3.12.15.
Python- und Drittanbieter-Lizenzen befinden sich im Laufzeit- bzw. site-Verzeichnis.
Alle Downloads, Paketversionen und SHA-256-Prüfsummen sind in manifest.json festgelegt.
Die Ansagenkomponente verwendet ausschließlich die mitgelieferten Pakete.
