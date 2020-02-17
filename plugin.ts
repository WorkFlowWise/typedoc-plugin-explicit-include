import { Component, ConverterComponent } from 'typedoc/dist/lib/converter/components';
import { Context } from 'typedoc/dist/lib/converter/context';
import { Converter } from 'typedoc/dist/lib/converter/converter';
import { CommentPlugin } from 'typedoc/dist/lib/converter/plugins';
import { IntrinsicType, ReflectionKind, TypeParameterReflection } from 'typedoc/dist/lib/models';
import {
  DeclarationReflection,
  ParameterReflection,
  ProjectReflection,
  SignatureReflection,
  TraverseProperty,
} from 'typedoc/dist/lib/models/reflections';
import { Reflection } from 'typedoc/dist/lib/models/reflections/abstract';
import { Options } from 'typedoc/dist/lib/utils/options';

@Component({ name: 'explicit-include' })
export class ExplicitIncludePlugin extends ConverterComponent {
  INCLUDE = 'include';

  initialize() {
    var options: Options = this.application.options;
    options.read({}, 0);

    this.listenTo(this.owner, {
      [Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
      [Converter.EVENT_END]: this.onEnd,
    });
  }

  private onEnd(context: Context, reflection: Reflection, node?) {
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
  private onDeclaration(context: Context, reflection: Reflection, node?) {
    let noIncludeCommentOnDeclaration = !reflection.comment || !reflection.comment.hasTag(this.INCLUDE);

    switch (reflection.kind) {
      case ReflectionKind.Variable:
      case ReflectionKind.Function:
        if (noIncludeCommentOnDeclaration) {
          ExplicitIncludePlugin.removeReflection(context.project, reflection);
        }
        break;
      default:
        break;
    }
  }

  /**
   * Remove the given reflection from the project.
   */
  static removeReflection(project: ProjectReflection, reflection: Reflection, deletedIds?: number[]) {
    reflection.traverse(child => ExplicitIncludePlugin.removeReflection(project, child, deletedIds));

    const parent = <DeclarationReflection>reflection.parent;
    if (!parent) {
      return;
    }
    parent.traverse((child: Reflection, property: TraverseProperty) => {
      if (child === reflection) {
        switch (property) {
          case TraverseProperty.Children:
            if (parent.children) {
              const index = parent.children.indexOf(<DeclarationReflection>reflection);
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
            if ((<SignatureReflection>reflection.parent).parameters) {
              const index = (<SignatureReflection>reflection.parent).parameters!.indexOf(
                <ParameterReflection>reflection,
              );
              if (index !== -1) {
                (<SignatureReflection>reflection.parent).parameters!.splice(index, 1);
              }
            }
            break;
          case TraverseProperty.SetSignature:
            delete parent.setSignature;
            break;
          case TraverseProperty.Signatures:
            if (parent.signatures) {
              const index = parent.signatures.indexOf(<SignatureReflection>reflection);
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
              const index = parent.typeParameters.indexOf(<TypeParameterReflection>reflection);
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
    } else {
      for (let key in project.symbolMapping) {
        if (project.symbolMapping.hasOwnProperty(key) && project.symbolMapping[key] === id) {
          delete project.symbolMapping[key];
        }
      }
    }
  }
}
