"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ExplicitIncludePlugin_1;
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("typedoc/dist/lib/converter/components");
const converter_1 = require("typedoc/dist/lib/converter/converter");
const plugins_1 = require("typedoc/dist/lib/converter/plugins");
const models_1 = require("typedoc/dist/lib/models");
const reflections_1 = require("typedoc/dist/lib/models/reflections");
let ExplicitIncludePlugin = ExplicitIncludePlugin_1 = class ExplicitIncludePlugin extends components_1.ConverterComponent {
    initialize() {
        var options = this.application.options;
        options.read({}, 0);
        this.listenTo(this.owner, {
            [converter_1.Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
            [converter_1.Converter.EVENT_END]: this.onEnd,
        });
    }
    onEnd(context, reflection, node) {
        context.project.files.forEach(file => {
            file.reflections.forEach(reflection => {
                if (reflection.comment) {
                    plugins_1.CommentPlugin.removeTags(reflection.comment, ExplicitIncludePlugin_1.INCLUDE);
                }
            });
        });
    }
    /**
     * Triggered when the converter has created a declaration reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently processed.
     * @param node  The node that is currently processed if available.
     */
    onDeclaration(context, reflection, node) {
        let noIncludeCommentOnDeclaration = !reflection.comment || !reflection.comment.hasTag(ExplicitIncludePlugin_1.INCLUDE);
        let noIncludeAllCommentOnParent = !ExplicitIncludePlugin_1.parentHasIncludeAll(reflection);
        switch (reflection.kind) {
            case models_1.ReflectionKind.Variable:
            case models_1.ReflectionKind.Function:
            case models_1.ReflectionKind.Property:
            case models_1.ReflectionKind.Method:
                if (noIncludeCommentOnDeclaration && noIncludeAllCommentOnParent) {
                    ExplicitIncludePlugin_1.removeReflection(context.project, reflection);
                }
                break;
            default:
                break;
        }
    }
    /**
     * Remove the given reflection from the project.
     */
    static removeReflection(project, reflection, deletedIds) {
        reflection.traverse(child => ExplicitIncludePlugin_1.removeReflection(project, child, deletedIds));
        const parent = reflection.parent;
        if (!parent) {
            return;
        }
        parent.traverse((child, property) => {
            if (child === reflection) {
                switch (property) {
                    case reflections_1.TraverseProperty.Children:
                        if (parent.children) {
                            const index = parent.children.indexOf(reflection);
                            if (index !== -1) {
                                parent.children.splice(index, 1);
                            }
                        }
                        break;
                    case reflections_1.TraverseProperty.GetSignature:
                        delete parent.getSignature;
                        break;
                    case reflections_1.TraverseProperty.IndexSignature:
                        delete parent.indexSignature;
                        break;
                    case reflections_1.TraverseProperty.Parameters:
                        if (reflection.parent.parameters) {
                            const index = reflection.parent.parameters.indexOf(reflection);
                            if (index !== -1) {
                                reflection.parent.parameters.splice(index, 1);
                            }
                        }
                        break;
                    case reflections_1.TraverseProperty.SetSignature:
                        delete parent.setSignature;
                        break;
                    case reflections_1.TraverseProperty.Signatures:
                        if (parent.signatures) {
                            const index = parent.signatures.indexOf(reflection);
                            if (index !== -1) {
                                parent.signatures.splice(index, 1);
                            }
                        }
                        break;
                    case reflections_1.TraverseProperty.TypeLiteral:
                        parent.type = new models_1.IntrinsicType('Object');
                        break;
                    case reflections_1.TraverseProperty.TypeParameter:
                        if (parent.typeParameters) {
                            const index = parent.typeParameters.indexOf(reflection);
                            if (index !== -1) {
                                parent.typeParameters.splice(index, 1);
                            }
                        }
                        break;
                }
            }
        });
        let id = reflection.id;
        delete project.reflections[id];
        // if an array was provided, keep track of the reflections that have been deleted, otherwise clean symbol mappings
        if (deletedIds) {
            deletedIds.push(id);
        }
        else {
            for (let key in project.symbolMapping) {
                if (project.symbolMapping.hasOwnProperty(key) && project.symbolMapping[key] === id) {
                    delete project.symbolMapping[key];
                }
            }
        }
    }
    static parentHasIncludeAll(reflection) {
        if (reflection.comment && reflection.comment.hasTag(ExplicitIncludePlugin_1.INCLUDE)) {
            return true;
        }
        else if (!reflection.parent) {
            return false;
        }
        return this.parentHasIncludeAll(reflection.parent);
    }
};
ExplicitIncludePlugin.INCLUDE = 'include';
ExplicitIncludePlugin = ExplicitIncludePlugin_1 = __decorate([
    components_1.Component({ name: 'explicit-include' })
], ExplicitIncludePlugin);
exports.ExplicitIncludePlugin = ExplicitIncludePlugin;
