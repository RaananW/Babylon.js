import * as React from "react";
import { type GlobalState } from "../../globalState";
import { type Nullable } from "core/types";
import { type Observer } from "core/Misc/observable";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import "./variables.scss";

/**
 * Represents a variable found across the graph's blocks.
 */
interface IVariableEntry {
    /** Variable name */
    name: string;
    /** Number of GetVariable blocks referencing this name */
    getCount: number;
    /** Number of SetVariable blocks referencing this name */
    setCount: number;
}

interface IVariablesPanelProps {
    globalState: GlobalState;
}

interface IVariablesPanelState {
    variables: IVariableEntry[];
    editingIndex: number | null;
    editingName: string;
}

/**
 * Panel component that lists all flow graph variables (referenced by
 * GetVariable / SetVariable blocks) and supports add, rename, and delete.
 */
export class VariablesPanelComponent extends React.Component<IVariablesPanelProps, IVariablesPanelState> {
    private _builtObserver: Nullable<Observer<void>> = null;

    /** @internal */
    constructor(props: IVariablesPanelProps) {
        super(props);
        this.state = { variables: [], editingIndex: null, editingName: "" };
    }

    /** @internal */
    override componentDidMount() {
        this._builtObserver = this.props.globalState.onBuiltObservable.add(() => {
            this._refreshVariables();
        });
        this._refreshVariables();
    }

    /** @internal */
    override componentWillUnmount() {
        this._builtObserver?.remove();
        this._builtObserver = null;
    }

    /**
     * Scan all blocks in the flow graph to build the variable list.
     */
    private _refreshVariables() {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            this.setState({ variables: [] });
            return;
        }

        const varMap = new Map<string, IVariableEntry>();

        const ensureVar = (name: string): IVariableEntry => {
            let entry = varMap.get(name);
            if (!entry) {
                entry = { name, getCount: 0, setCount: 0 };
                varMap.set(name, entry);
            }
            return entry;
        };

        fg.visitAllBlocks((block: FlowGraphBlock) => {
            const className = block.getClassName();
            const config = block.config as any;
            if (className === FlowGraphBlockNames.GetVariable) {
                if (config?.variable) {
                    ensureVar(config.variable).getCount++;
                }
            } else if (className === FlowGraphBlockNames.SetVariable) {
                if (config?.variables) {
                    for (const v of config.variables) {
                        ensureVar(v).setCount++;
                    }
                } else if (config?.variable) {
                    ensureVar(config.variable).setCount++;
                }
            }
        });

        const variables = Array.from(varMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        this.setState({ variables });
    }

    /**
     * Rename a variable across all GetVariable and SetVariable blocks.
     * @param oldName - the current name
     * @param newName - the new name
     */
    private _renameVariable(oldName: string, newName: string) {
        if (!newName || newName === oldName) {
            return;
        }

        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        fg.visitAllBlocks((block: FlowGraphBlock) => {
            const className = block.getClassName();
            const config = block.config as any;
            if (className === FlowGraphBlockNames.GetVariable) {
                if (config?.variable === oldName) {
                    config.variable = newName;
                }
            } else if (className === FlowGraphBlockNames.SetVariable) {
                if (config?.variables) {
                    const idx = config.variables.indexOf(oldName);
                    if (idx !== -1) {
                        config.variables[idx] = newName;
                        // Also rename the data input
                        const dataInput = block.getDataInput(oldName);
                        if (dataInput) {
                            (dataInput as any)._name = newName;
                        }
                    }
                } else if (config?.variable === oldName) {
                    config.variable = newName;
                }
            }
        });

        // Also rename in any context's userVariables
        let ctxIndex = 0;
        let ctx = fg.getContext(ctxIndex);
        while (ctx) {
            if (ctx.hasVariable(oldName)) {
                const value = ctx.getVariable(oldName);
                ctx.setVariable(newName, value);
                // Remove old entry
                delete (ctx as any)._userVariables[oldName];
            }
            ctxIndex++;
            ctx = fg.getContext(ctxIndex);
        }

        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
        this._refreshVariables();
    }

    /**
     * Delete a variable by removing it from all GetVariable and SetVariable blocks
     * that reference it. The blocks themselves are NOT deleted — their variable
     * reference is cleared.
     * @param name - the variable name to delete
     */
    private _deleteVariable(name: string) {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        const blocksToRemove: FlowGraphBlock[] = [];

        fg.visitAllBlocks((block: FlowGraphBlock) => {
            const className = block.getClassName();
            const config = block.config as any;
            if (className === FlowGraphBlockNames.GetVariable && config?.variable === name) {
                blocksToRemove.push(block);
            } else if (className === FlowGraphBlockNames.SetVariable) {
                if (config?.variables) {
                    const idx = config.variables.indexOf(name);
                    if (idx !== -1) {
                        config.variables.splice(idx, 1);
                        if (config.variables.length === 0) {
                            blocksToRemove.push(block);
                        }
                    }
                } else if (config?.variable === name) {
                    blocksToRemove.push(block);
                }
            }
        });

        for (const block of blocksToRemove) {
            fg.removeBlock(block);
        }

        // Remove from contexts
        let ctxIndex = 0;
        let ctx = fg.getContext(ctxIndex);
        while (ctx) {
            if (ctx.hasVariable(name)) {
                delete (ctx as any)._userVariables[name];
            }
            ctxIndex++;
            ctx = fg.getContext(ctxIndex);
        }

        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
        this._refreshVariables();
    }

    /**
     * Add a new variable by creating a GetVariable block with a default name.
     */
    private _addVariable() {
        // Find a unique name
        const existing = new Set(this.state.variables.map((v) => v.name));
        let idx = 1;
        let name = "newVariable";
        while (existing.has(name)) {
            name = `newVariable${idx++}`;
        }

        // Add a SetVariable block referencing this name so the variable is registered
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        // Set the variable on context 0 with a default empty value
        let ctx = fg.getContext(0);
        if (!ctx) {
            fg.start();
            ctx = fg.getContext(0);
            fg.stop();
        }
        if (ctx) {
            ctx.setVariable(name, undefined);
        }

        this._refreshVariables();

        // Start editing the new variable name
        const newVars = [...this.state.variables, { name, getCount: 0, setCount: 0 }].sort((a, b) => a.name.localeCompare(b.name));
        const newIdx = newVars.findIndex((v) => v.name === name);
        this.setState({ variables: newVars, editingIndex: newIdx, editingName: name });
    }

    private _startEditing(index: number) {
        this.setState({ editingIndex: index, editingName: this.state.variables[index].name });
    }

    private _commitEditing() {
        const { editingIndex, editingName, variables } = this.state;
        if (editingIndex === null || editingIndex >= variables.length) {
            this.setState({ editingIndex: null });
            return;
        }
        const oldName = variables[editingIndex].name;
        const newName = editingName.trim();
        this.setState({ editingIndex: null });
        if (newName && newName !== oldName) {
            this._renameVariable(oldName, newName);
        }
    }

    /** @internal */
    override render() {
        const { variables, editingIndex, editingName } = this.state;

        return (
            <div className="fge-variables-panel">
                <div className="fge-variables-header">
                    <h3>Variables</h3>
                    <button className="fge-variables-add-btn" onClick={() => this._addVariable()} title="Add a new variable">
                        + Add
                    </button>
                </div>
                {variables.length === 0 && (
                    <div className="fge-variables-empty">No variables defined. Use GetVariable / SetVariable blocks or click &quot;+ Add&quot; to create one.</div>
                )}
                {variables.map((v, idx) => (
                    <div key={v.name} className="fge-variable-row">
                        {editingIndex === idx ? (
                            <input
                                className="fge-variable-name"
                                value={editingName}
                                onChange={(e) => this.setState({ editingName: e.target.value })}
                                onBlur={() => this._commitEditing()}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        this._commitEditing();
                                    } else if (e.key === "Escape") {
                                        this.setState({ editingIndex: null });
                                    }
                                }}
                                autoFocus
                            />
                        ) : (
                            <span className="fge-variable-name" onDoubleClick={() => this._startEditing(idx)} title="Double-click to rename">
                                {v.name}
                            </span>
                        )}
                        <span className="fge-variable-type" title={`${v.getCount} get, ${v.setCount} set`}>
                            {v.getCount}G / {v.setCount}S
                        </span>
                        <button className="fge-variable-delete-btn" title="Delete variable and its blocks" onClick={() => this._deleteVariable(v.name)}>
                            ✕
                        </button>
                    </div>
                ))}
                <div className="fge-variables-info">
                    Double-click a name to rename. Renaming propagates to all Get/Set blocks.
                    <br />
                    Deleting a variable removes all GetVariable and SetVariable blocks that reference it.
                </div>
            </div>
        );
    }
}
