var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typedoc/dist/lib/converter/components", "typedoc/dist/lib/converter/converter", "typedoc/dist/lib/converter/plugins", "typedoc/dist/lib/models", "typedoc/dist/lib/models/reflections", "typedoc/dist/lib/utils/options"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var components_1 = require("typedoc/dist/lib/converter/components");
    var converter_1 = require("typedoc/dist/lib/converter/converter");
    var plugins_1 = require("typedoc/dist/lib/converter/plugins");
    var models_1 = require("typedoc/dist/lib/models");
    var reflections_1 = require("typedoc/dist/lib/models/reflections");
    var options_1 = require("typedoc/dist/lib/utils/options");
    var ExplicitIncludePlugin = /** @class */ (function (_super) {
        __extends(ExplicitIncludePlugin, _super);
        function ExplicitIncludePlugin() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.INCLUDE = 'include';
            return _this;
        }
        ExplicitIncludePlugin_1 = ExplicitIncludePlugin;
        ExplicitIncludePlugin.prototype.initialize = function () {
            var _a;
            debugger;
            var options = this.application.options;
            options.read({}, options_1.OptionsReadMode.Prefetch);
            this.listenTo(this.owner, (_a = {},
                _a[converter_1.Converter.EVENT_CREATE_DECLARATION] = this.onDeclaration,
                _a[converter_1.Converter.EVENT_END] = this.onEnd,
                _a));
        };
        ExplicitIncludePlugin.prototype.onEnd = function (context, reflection, node) {
            var _this = this;
            context.project.files.forEach(function (file) {
                file.reflections.forEach(function (reflection) {
                    if (reflection.comment) {
                        plugins_1.CommentPlugin.removeTags(reflection.comment, _this.INCLUDE);
                    }
                });
            });
        };
        /**
         * Triggered when the converter has created a declaration reflection.
         *
         * @param context  The context object describing the current state the converter is in.
         * @param reflection  The reflection that is currently processed.
         * @param node  The node that is currently processed if available.
         */
        ExplicitIncludePlugin.prototype.onDeclaration = function (context, reflection, node) {
            var noIncludeCommentOnDeclaration = !reflection.comment || !reflection.comment.hasTag(this.INCLUDE);
            var noIncludeCommentOnParentDeclaration = !reflection.parent
                || !reflection.parent.comment
                || !reflection.parent.comment.hasTag(this.INCLUDE);
            switch (reflection.kind) {
                case models_1.ReflectionKind.Class:
                case models_1.ReflectionKind.Interface:
                    if (noIncludeCommentOnDeclaration) {
                        ExplicitIncludePlugin_1.removeReflection(context.project, reflection);
                    }
                    break;
                case models_1.ReflectionKind.Constructor:
                    ExplicitIncludePlugin_1.removeReflection(context.project, reflection);
                    break;
                default:
                    if (noIncludeCommentOnDeclaration && noIncludeCommentOnParentDeclaration) {
                        ExplicitIncludePlugin_1.removeReflection(context.project, reflection);
                    }
                    break;
            }
        };
        /**
         * Remove the given reflection from the project.
         */
        ExplicitIncludePlugin.removeReflection = function (project, reflection, deletedIds) {
            reflection.traverse(function (child) { return ExplicitIncludePlugin_1.removeReflection(project, child, deletedIds); });
            var parent = reflection.parent;
            if (!parent) {
                return;
            }
            parent.traverse(function (child, property) {
                if (child === reflection) {
                    switch (property) {
                        case reflections_1.TraverseProperty.Children:
                            if (parent.children) {
                                var index = parent.children.indexOf(reflection);
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
                                var index = reflection.parent.parameters.indexOf(reflection);
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
                                var index = parent.signatures.indexOf(reflection);
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
                                var index = parent.typeParameters.indexOf(reflection);
                                if (index !== -1) {
                                    parent.typeParameters.splice(index, 1);
                                }
                            }
                            break;
                    }
                }
            });
            var id = reflection.id;
            delete project.reflections[id];
            // if an array was provided, keep track of the reflections that have been deleted, otherwise clean symbol mappings
            if (deletedIds) {
                deletedIds.push(id);
            }
            else {
                for (var key in project.symbolMapping) {
                    if (project.symbolMapping.hasOwnProperty(key) && project.symbolMapping[key] === id) {
                        delete project.symbolMapping[key];
                    }
                }
            }
        };
        var ExplicitIncludePlugin_1;
        ExplicitIncludePlugin = ExplicitIncludePlugin_1 = __decorate([
            components_1.Component({ name: 'explicit-include' })
        ], ExplicitIncludePlugin);
        return ExplicitIncludePlugin;
    }(components_1.ConverterComponent));
    exports.ExplicitIncludePlugin = ExplicitIncludePlugin;
});
