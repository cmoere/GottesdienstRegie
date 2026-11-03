# Local image runtime

stable-diffusion.cpp: https://github.com/leejet/stable-diffusion.cpp — MIT.
Pinned revision: 3be23788fc0c9f35a2c24b1211caae11d4a54dbc.
GGML: https://github.com/leejet/ggml — MIT.
Pinned revision: d49c49e1dd361ba3c0a77c90b5b1404b83969aa8.

Original notices, third-party license files and headers containing embedded license notices accompany this runtime under `licenses/`.

Windows packages include unmodified app-local Microsoft Visual C++ release redistributable DLLs from the licensed Visual Studio build environment. Their source version, size and SHA256 are recorded in `verification.json`; the relevant vendor notice is under `licenses/`. No redistributable installer is run on the end-user computer.

Model weights are separate verified in-app downloads. Their pinned repositories, revisions, file hashes and original license texts are included in `shared/localSlideModel.json` and `shared/localImageModel.json` in the application. Each installed model directory contains its original license. The image model uses OpenRAIL++; the language model uses Apache2.0. Model inference runs locally and only OFF AIR. Generated images remain drafts requiring human review.
