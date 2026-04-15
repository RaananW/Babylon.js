import * as React from "react";
import { type GlobalState } from "../../globalState";
import { type Nullable } from "core/types";
import { type Observer } from "core/Misc/observable";
import { FlowGraphState } from "core/FlowGraph/flowGraph";
import { GatherVariables, RenameVariable, DeleteVariable, FormatVariableValue, ParseVariableValue, type IVariableEntry } from "../../variableUtils";
import "./variables.scss";

interface IVariablesPanelProps {
    globalState: GlobalState;
}

interface IVariablesPanelState {
    variables: IVariableEntry[];
    /** Index of the variable whose *name* is being edited (null = none). */
    editingNameIndex: number | null;
    editingName: string;
    /** Index of the variable whose *value* is being edited (null = none). */
    editingValueIndex: number | null;
    editingValue: string;
    isRunning: boolean;
    runtimeValues: Map<string, string>;
    collapsed: boolean;
}

/**
 * Compact variables strip that sits between the toolbar and the canvas.
 * Shows variable names (shared across contexts) and per-context values
 * with inline editing for both.
 */
export class VariablesPanelComponent extends React.Component<IVariablesPanelProps, IVariablesPanelState> {
    private _builtObserver: Nullable<Observer<void>> = null;
    private _stateObserver: Nullable<Observer<FlowGraphState>> = null;
    private _contextChangedObserver: Nullable<Observer<number>> = null;
    private _pollTimer: ReturnType<typeof setInterval> | null = null;

    /** @internal */
    constructor(props: IVariablesPanelProps) {
        super(props);
        this.state = {
            variables: [],
            editingNameIndex: null,
            editingName: "",
            editingValueIndex: null,
            editingValue: "",
            isRunning: false,
            runtimeValues: new Map(),
            collapsed: false,
        };
    }

    /** @internal */
    override componentDidMount() {
        this._builtObserver = this.props.globalState.onBuiltObservable.add(() => {
            this._subscribeToFlowGraph();
            this._refreshVariables();
        });
        this._contextChangedObserver = this.props.globalState.onSelectedContextChanged.add(() => {
            this._pollRuntimeValues();
        });
        this._subscribeToFlowGraph();
        this._refreshVariables();
    }

    /** @internal */
    override componentWillUnmount() {
        this._builtObserver?.remove();
        this._builtObserver = null;
        this._stateObserver?.remove();
        this._stateObserver = null;
        this._contextChangedObserver?.remove();
        this._contextChangedObserver = null;
        this._stopPolling();
    }

    private _subscribeToFlowGraph() {
        this._stateObserver?.remove();
        this._stateObserver = null;
        this._stopPolling();

        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        const running = fg.state === FlowGraphState.Started;
        this.setState({ isRunning: running });
        if (running) {
            this._startPolling();
        }

        this._stateObserver = fg.onStateChangedObservable.add((newState) => {
            const isRunning = newState === FlowGraphState.Started;
            this.setState({ isRunning });
            if (isRunning) {
                this._startPolling();
            } else {
                this._pollRuntimeValues();
                this._stopPolling();
            }
        });
    }

    private _startPolling() {
        this._stopPolling();
        this._pollRuntimeValues();
        this._pollTimer = setInterval(() => this._pollRuntimeValues(), 200);
    }

    private _stopPolling() {
        if (this._pollTimer !== null) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    }

    private _pollRuntimeValues() {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        const values = new Map<string, string>();
        const ctx = fg.getContext(this.props.globalState.selectedContextIndex);
        if (ctx) {
            for (const [key, val] of Object.entries(ctx.userVariables)) {
                values.set(key, FormatVariableValue(val));
            }
        }
        this.setState({ runtimeValues: values });
    }

    private _refreshVariables() {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            this.setState({ variables: [] });
            return;
        }

        const variables = GatherVariables(fg);
        this.setState({ variables });
    }

    private _renameVariable(oldName: string, newName: string) {
        if (!newName || newName === oldName) {
            return;
        }

        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        RenameVariable(fg, oldName, newName);
        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
        this._refreshVariables();
    }

    private _deleteVariable(name: string) {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        DeleteVariable(fg, name);
        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
        this._refreshVariables();
    }

    private _addVariable() {
        const existing = new Set(this.state.variables.map((v) => v.name));
        let idx = 1;
        let name = "newVariable";
        while (existing.has(name)) {
            name = `newVariable${idx++}`;
        }

        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        let ctx = fg.getContext(this.props.globalState.selectedContextIndex);
        if (!ctx) {
            ctx = fg.createContext();
        }
        ctx.setVariable(name, undefined);

        const variables = GatherVariables(fg);
        const newIdx = variables.findIndex((v) => v.name === name);
        this.setState({ variables, editingNameIndex: newIdx, editingName: name, collapsed: false });
    }

    // --- Name editing ---

    private _startNameEditing(index: number) {
        this.setState({ editingNameIndex: index, editingName: this.state.variables[index].name });
    }

    private _commitNameEditing() {
        const { editingNameIndex, editingName, variables } = this.state;
        if (editingNameIndex === null || editingNameIndex >= variables.length) {
            this.setState({ editingNameIndex: null });
            return;
        }
        const oldName = variables[editingNameIndex].name;
        const newName = editingName.trim();
        this.setState({ editingNameIndex: null });
        if (newName && newName !== oldName) {
            this._renameVariable(oldName, newName);
        }
    }

    // --- Value editing ---

    private _startValueEditing(index: number) {
        const name = this.state.variables[index].name;
        const display = this.state.runtimeValues.get(name) ?? "undefined";
        this.setState({ editingValueIndex: index, editingValue: display });
    }

    private _commitValueEditing() {
        const { editingValueIndex, editingValue, variables } = this.state;
        if (editingValueIndex === null || editingValueIndex >= variables.length) {
            this.setState({ editingValueIndex: null });
            return;
        }
        const name = variables[editingValueIndex].name;
        this.setState({ editingValueIndex: null });

        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        const ctx = fg.getContext(this.props.globalState.selectedContextIndex);
        if (!ctx) {
            return;
        }

        const currentValue = ctx.userVariables[name];
        const parsed = ParseVariableValue(editingValue, currentValue);
        ctx.setVariable(name, parsed);
        this._pollRuntimeValues();
    }

    /** @internal */
    override render() {
        const { variables, editingNameIndex, editingName, editingValueIndex, editingValue, runtimeValues, collapsed } = this.state;
        const varCount = variables.length;

        return (
            <div className="fge-variables-strip">
                <div className="fge-variables-strip-header">
                    <button className="fge-variables-toggle" onClick={() => this.setState({ collapsed: !collapsed })} title={collapsed ? "Expand variables" : "Collapse variables"}>
                        {collapsed ? "▶" : "▼"}
                    </button>
                    <span className="fge-variables-strip-title">Variables{varCount > 0 ? ` (${varCount})` : ""}</span>
                    {this.state.isRunning && <span className="fge-variables-live-badge">● Live</span>}
                    <button className="fge-variables-strip-add" onClick={() => this._addVariable()} title="Add a new variable">
                        +
                    </button>
                </div>
                {!collapsed && (
                    <div className="fge-variables-strip-body">
                        {variables.length === 0 ? (
                            <div className="fge-variables-strip-empty">No variables. Click + to add one, or use GetVariable/SetVariable blocks.</div>
                        ) : (
                            <div className="fge-variables-strip-table">
                                {variables.map((v, idx) => (
                                    <div key={v.name} className="fge-var-cell">
                                        <div className="fge-var-cell-name-row">
                                            {editingNameIndex === idx ? (
                                                <input
                                                    className="fge-var-cell-name-input"
                                                    value={editingName}
                                                    onChange={(e) => this.setState({ editingName: e.target.value })}
                                                    onFocus={() => {
                                                        this.props.globalState.lockObject.lock = true;
                                                    }}
                                                    onBlur={() => {
                                                        this.props.globalState.lockObject.lock = false;
                                                        this._commitNameEditing();
                                                    }}
                                                    onKeyDown={(e) => {
                                                        e.stopPropagation();
                                                        if (e.key === "Enter") {
                                                            this._commitNameEditing();
                                                        } else if (e.key === "Escape") {
                                                            this.setState({ editingNameIndex: null });
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    className="fge-var-cell-name"
                                                    onDoubleClick={() => this._startNameEditing(idx)}
                                                    title={`${v.name} (${v.getCount}G/${v.setCount}S) — double-click to rename`}
                                                >
                                                    {v.name}
                                                </span>
                                            )}
                                            <button className="fge-var-cell-delete" title="Delete variable and its blocks" onClick={() => this._deleteVariable(v.name)}>
                                                ✕
                                            </button>
                                        </div>
                                        <div className="fge-var-cell-value-row">
                                            {editingValueIndex === idx ? (
                                                <input
                                                    className="fge-var-cell-value-input"
                                                    value={editingValue}
                                                    onChange={(e) => this.setState({ editingValue: e.target.value })}
                                                    onFocus={() => {
                                                        this.props.globalState.lockObject.lock = true;
                                                    }}
                                                    onBlur={() => {
                                                        this.props.globalState.lockObject.lock = false;
                                                        this._commitValueEditing();
                                                    }}
                                                    onKeyDown={(e) => {
                                                        e.stopPropagation();
                                                        if (e.key === "Enter") {
                                                            this._commitValueEditing();
                                                        } else if (e.key === "Escape") {
                                                            this.setState({ editingValueIndex: null });
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="fge-var-cell-value" onClick={() => this._startValueEditing(idx)} title="Click to edit value for this context">
                                                    {runtimeValues.get(v.name) ?? "undefined"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
}
