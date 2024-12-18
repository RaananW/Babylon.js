import * as React from "react";
import type { Color4, Color3 } from "core/Maths/math.color";
import { ColorPickerComponent } from "../colorPicker/ColorPicker";
import type { LockObject } from "../../tabs/propertyGrids/lockObject";
import * as style from "./ColorPickerLineComponent.module.scss";

export interface IColorPickerLineComponentProps {
    value: Color4 | Color3;
    linearHint?: boolean;
    onColorChanged: (newOne: string) => void;
    icon?: string;
    iconLabel?: string;
    shouldPopRight?: boolean;
    lockObject?: LockObject;
    backgroundColor?: string;
}

interface IColorPickerComponentState {
    pickerEnabled: boolean;
    color: Color3 | Color4;
    hex: string;
}

export class ColorPickerLineComponent extends React.Component<IColorPickerLineComponentProps, IColorPickerComponentState> {
    private _floatRef: React.RefObject<HTMLDivElement>;
    private _floatHostRef: React.RefObject<HTMLDivElement>;
    private _coverRef: React.RefObject<HTMLDivElement>;

    constructor(props: IColorPickerLineComponentProps) {
        super(props);

        this.state = { pickerEnabled: false, color: this.props.value, hex: this.getHexString(props) };

        this._floatRef = React.createRef();
        this._floatHostRef = React.createRef();
        this._coverRef = React.createRef();
    }

    syncPositions() {
        const div = this._floatRef.current as HTMLDivElement;
        const host = this._floatHostRef.current as HTMLDivElement;

        if (!div || !host) {
            return;
        }

        let top = host.getBoundingClientRect().top;
        const height = div.getBoundingClientRect().height;

        if (top + height + 10 > window.innerHeight) {
            top = window.innerHeight - height - 10;
        }

        div.style.top = top + "px";
        if (!this.props.shouldPopRight) {
            div.style.left = host.getBoundingClientRect().left - div.getBoundingClientRect().width + "px";
        } else {
            div.style.left = host.getBoundingClientRect().left + "px";
        }
    }

    override shouldComponentUpdate(nextProps: IColorPickerLineComponentProps, nextState: IColorPickerComponentState) {
        const diffProps = this.getHexString(nextProps) !== this.getHexString();

        if (diffProps) {
            nextState.color = nextProps.value;
            nextState.hex = this.getHexString(nextProps);
        }

        return diffProps || nextState.hex !== this.state.hex || nextState.pickerEnabled !== this.state.pickerEnabled;
    }

    getHexString(props = this.props) {
        return props.value.toHexString();
    }

    override componentDidUpdate() {
        this.syncPositions();
    }

    override componentDidMount() {
        this.syncPositions();
    }

    override render() {
        return (
            <div className={style.colorPicker}>
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                <div className={style.colorRectBackground} ref={this._floatHostRef} onClick={() => this.setState({ pickerEnabled: true })}>
                    <div className={style.colorRect} style={{ background: this.state.hex }}></div>
                </div>
                {this.state.pickerEnabled && (
                    <>
                        <div
                            ref={this._coverRef}
                            className={style.colorPickerCover}
                            onClick={(evt) => {
                                if (evt.target !== this._coverRef.current) {
                                    return;
                                }
                                this.setState({ pickerEnabled: false });
                            }}
                        >
                            <div className={style.colorPickerFloat} ref={this._floatRef}>
                                <ColorPickerComponent
                                    backgroundColor={this.props.backgroundColor}
                                    lockObject={this.props.lockObject || ({} as any)}
                                    color={this.state.color}
                                    linearhint={this.props.linearHint}
                                    onColorChanged={(color: Color3 | Color4) => {
                                        const hex: string = color.toHexString();
                                        this.setState({ hex, color });
                                        this.props.onColorChanged(hex);
                                    }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }
}
