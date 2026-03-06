/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import audioSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./audioSceneComponent.pure";

import { Sound } from "./sound";
import { SoundTrack } from "./soundTrack";
import { Vector3 } from "../Maths/math.vector";
import { SceneComponentConstants } from "../sceneComponent";
import { Scene } from "../scene";
import { AbstractEngine } from "core/Engines/abstractEngine";
import { AddParser } from "core/Loading/Plugins/babylonFileParser.function";
import type { Nullable } from "../types";
import type { AssetContainer } from "../assetContainer";


// Adds the parser to the scene parsers.
AddParser(SceneComponentConstants.NAME_AUDIO, (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => {
    // TODO: add sound
    let loadedSounds: Sound[] = [];
    let loadedSound: Sound;
    container.sounds = container.sounds || [];
    if (parsedData.sounds !== undefined && parsedData.sounds !== null) {
        for (let index = 0, cache = parsedData.sounds.length; index < cache; index++) {
            const parsedSound = parsedData.sounds[index];
            if (AbstractEngine.audioEngine?.canUseWebAudio) {
                if (!parsedSound.url) {
                    parsedSound.url = parsedSound.name;
                }
                if (!loadedSounds[parsedSound.url]) {
                    loadedSound = Sound.Parse(parsedSound, scene, rootUrl);
                    loadedSounds[parsedSound.url] = loadedSound;
                    container.sounds.push(loadedSound);
                } else {
                    container.sounds.push(Sound.Parse(parsedSound, scene, rootUrl, loadedSounds[parsedSound.url]));
                }
            } else {
                container.sounds.push(new Sound(parsedSound.name, null, scene));
            }
        }
    }

    loadedSounds = [];
});


Object.defineProperty(Scene.prototype, "mainSoundTrack", {
    get: function (this: Scene) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        if (!this._mainSoundTrack) {
            this._mainSoundTrack = new SoundTrack(this, { mainTrack: true });
        }

        return this._mainSoundTrack;
    },
    enumerable: true,
    configurable: true,
});


Scene.prototype.getSoundByName = function (name: string): Nullable<Sound> {
    let index: number;
    for (index = 0; index < this.mainSoundTrack.soundCollection.length; index++) {
        if (this.mainSoundTrack.soundCollection[index].name === name) {
            return this.mainSoundTrack.soundCollection[index];
        }
    }

    if (this.soundTracks) {
        for (let sdIndex = 0; sdIndex < this.soundTracks.length; sdIndex++) {
            for (index = 0; index < this.soundTracks[sdIndex].soundCollection.length; index++) {
                if (this.soundTracks[sdIndex].soundCollection[index].name === name) {
                    return this.soundTracks[sdIndex].soundCollection[index];
                }
            }
        }
    }

    return null;
};


Object.defineProperty(Scene.prototype, "audioEnabled", {
    get: function (this: Scene) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        return compo.audioEnabled;
    },
    set: function (this: Scene, value: boolean) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        if (value) {
            compo.enableAudio();
        } else {
            compo.disableAudio();
        }
    },
    enumerable: true,
    configurable: true,
});


Object.defineProperty(Scene.prototype, "headphone", {
    get: function (this: Scene) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        return compo.headphone;
    },
    set: function (this: Scene, value: boolean) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        if (value) {
            compo.switchAudioModeForHeadphones();
        } else {
            compo.switchAudioModeForNormalSpeakers();
        }
    },
    enumerable: true,
    configurable: true,
});


Object.defineProperty(Scene.prototype, "audioListenerPositionProvider", {
    get: function (this: Scene) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        return compo.audioListenerPositionProvider;
    },
    set: function (this: Scene, value: () => Vector3) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        if (value && typeof value !== "function") {
            throw new Error("The value passed to [Scene.audioListenerPositionProvider] must be a function that returns a Vector3");
        } else {
            compo.audioListenerPositionProvider = value;
        }
    },
    enumerable: true,
    configurable: true,
});


Object.defineProperty(Scene.prototype, "audioListenerRotationProvider", {
    get: function (this: Scene) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        return compo.audioListenerRotationProvider;
    },
    set: function (this: Scene, value: () => Vector3) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        if (value && typeof value !== "function") {
            throw new Error("The value passed to [Scene.audioListenerRotationProvider] must be a function that returns a Vector3");
        } else {
            compo.audioListenerRotationProvider = value;
        }
    },
    enumerable: true,
    configurable: true,
});


Object.defineProperty(Scene.prototype, "audioPositioningRefreshRate", {
    get: function (this: Scene) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        return compo.audioPositioningRefreshRate;
    },
    set: function (this: Scene, value: number) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        compo.audioPositioningRefreshRate = value;
    },
    enumerable: true,
    configurable: true,
});


Sound._SceneComponentInitialization = (scene: Scene) => {
    let compo = scene._getComponent(SceneComponentConstants.NAME_AUDIO);
    if (!compo) {
        compo = new AudioSceneComponent(scene);
        scene._addComponent(compo);
    }
};
