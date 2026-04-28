export * from "./baseTexture.polynomial.types";

import { type Nullable } from "../../types"
import { type SphericalPolynomial } from "../../Maths/sphericalPolynomial"
import { CubeMapToSphericalPolynomialTools } from "../../Misc/HighDynamicRange/cubemapToSphericalPolynomial";
import { BaseTexture } from "./baseTexture";

let _registered = false;

/**
 * Register side effects for baseTexture.polynomial.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerBaseTexturePolynomial(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    BaseTexture.prototype.forceSphericalPolynomialsRecompute = function (): void {
        if (this._texture) {
            this._texture._sphericalPolynomial = null;
            this._texture._sphericalPolynomialPromise = null;
            this._texture._sphericalPolynomialComputed = false;
        }
    };

    Object.defineProperty(BaseTexture.prototype, "sphericalPolynomial", {
        get: function (this: BaseTexture) {
            if (this._texture) {
                if (this._texture._sphericalPolynomial || this._texture._sphericalPolynomialComputed) {
                    return this._texture._sphericalPolynomial;
                }

                if (this._texture.isReady) {
                    if (!this._texture._sphericalPolynomialPromise) {
                        this._texture._sphericalPolynomialPromise = CubeMapToSphericalPolynomialTools.ConvertCubeMapTextureToSphericalPolynomial(this);
                        if (this._texture._sphericalPolynomialPromise === null) {
                            this._texture._sphericalPolynomialComputed = true;
                        } else {
                            // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
                            this._texture._sphericalPolynomialPromise.then((sphericalPolynomial) => {
                                this._texture!._sphericalPolynomial = sphericalPolynomial;
                                this._texture!._sphericalPolynomialComputed = true;
                            });
                        }
                    }

                    return null;
                }
            }

            return null;
        },
        set: function (this: BaseTexture, value: Nullable<SphericalPolynomial>) {
            if (this._texture) {
                this._texture._sphericalPolynomial = value;
            }
        },
        enumerable: true,
        configurable: true,
    });
}
