var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ExplicitIncludePlugin_1;
import { Component, ConverterComponent } from 'typedoc/dist/lib/converter/components';
import { Converter } from 'typedoc/dist/lib/converter/converter';
import { CommentPlugin } from 'typedoc/dist/lib/converter/plugins';
import { IntrinsicType, ReflectionKind } from 'typedoc/dist/lib/models';
import { TraverseProperty } from 'typedoc/dist/lib/models/reflections';
import { OptionsReadMode } from 'typedoc/dist/lib/utils/options';
let ExplicitIncludePlugin = ExplicitIncludePlugin_1 = class ExplicitIncludePlugin extends ConverterComponent {
    constructor() {
        super(...arguments);
        this.INCLUDE = 'include';
    }
    initialize() {
        debugger;
        var options = this.application.options;
        options.read({}, OptionsReadMode.Prefetch);
        this.listenTo(this.owner, {
            [Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
            [Converter.EVENT_END]: this.onEnd,
        });
    }
    onEnd(context, reflection, node) {
        context.project.files.forEach(file => {
            file.reflections.forEach(reflection => {
                if (reflection.comment) {
                    CommentPlugin.removeTags(reflection.comment, this.INCLUDE);
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
        let noIncludeCommentOnDeclaration = !reflection.comment || !reflection.comment.hasTag(this.INCLUDE);
        let noIncludeCommentOnParentDeclaration = !reflection.parent
            || !reflection.parent.comment
            || !reflection.parent.comment.hasTag(this.INCLUDE);
        switch (reflection.kind) {
            case ReflectionKind.Class:
            case ReflectionKind.Interface:
                if (noIncludeCommentOnDeclaration) {
                    ExplicitIncludePlugin_1.removeReflection(context.project, reflection);
                }
                break;
            case ReflectionKind.Constructor:
                ExplicitIncludePlugin_1.removeReflection(context.project, reflection);
                break;
            default:
                if (noIncludeCommentOnDeclaration && noIncludeCommentOnParentDeclaration) {
                    ExplicitIncludePlugin_1.removeReflection(context.project, reflection);
                }
                break;
        }
    }
    /**
     * Remove the given reflection from the project.
     */
    static removeReflection(project, reflection, deletedIds) {
        reflection.traverse((child) => ExplicitIncludePlugin_1.removeReflection(project, child, deletedIds));
        const parent = reflection.parent;
        if (!parent) {
            return;
        }
        parent.traverse((child, property) => {
            if (child === reflection) {
                switch (property) {
                    case TraverseProperty.Children:
                        if (parent.children) {
                            const index = parent.children.indexOf(reflection);
                            if (index !== -1) {
                                parent.children.splice(index, 1);
                            }
                        }
                        break;
                    case TraverseProperty.GetSignature:
                        delete parent.getSignature;
                        break;
                    case TraverseProperty.IndexSignature:
                        delete parent.indexSignature;
                        break;
                    case TraverseProperty.Parameters:
                        if (reflection.parent.parameters) {
                            const index = reflection.parent.parameters.indexOf(reflection);
                            if (index !== -1) {
                                reflection.parent.parameters.splice(index, 1);
                            }
                        }
                        break;
                    case TraverseProperty.SetSignature:
                        delete parent.setSignature;
                        break;
                    case TraverseProperty.Signatures:
                        if (parent.signatures) {
                            const index = parent.signatures.indexOf(reflection);
                            if (index !== -1) {
                                parent.signatures.splice(index, 1);
                            }
                        }
                        break;
                    case TraverseProperty.TypeLiteral:
                        parent.type = new IntrinsicType('Object');
                        break;
                    case TraverseProperty.TypeParameter:
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
};
ExplicitIncludePlugin = ExplicitIncludePlugin_1 = __decorate([
    Component({ name: 'explicit-include' })
], ExplicitIncludePlugin);
export { ExplicitIncludePlugin };
