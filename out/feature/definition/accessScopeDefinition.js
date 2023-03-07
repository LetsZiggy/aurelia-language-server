"use strict";
/**
 * Defintion[Access Scope]: http://aurelia.io/docs/binding/how-it-works#abstract-syntax-tree
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccessScopeViewModelDefinition = exports.getAccessScopeDefinition = void 0;
const ViewRegions_1 = require("../../aot/parser/regions/ViewRegions");
const find_source_word_1 = require("../../common/documens/find-source-word");
const related_1 = require("../../common/documens/related");
const TextDocumentUtils_1 = require("../../common/documens/TextDocumentUtils");
const uri_utils_1 = require("../../common/view/uri-utils");
/**
 * Priority
 * 1. Inside view itself
 *   1.1 repeat.for=">rule< of rules"
 *
 * 2. To related view model
 *  Below all have same logic:
 *  2.1 inter-bindable.bind=">increaseCounter()<"
 *  2.2 <div css="width: ${>message<}px;"></div>
 *  2.3 ${grammarRules.length}
 */
function getAccessScopeDefinition(aureliaProgram, document, position, region, 
/**
 * All regions to also find definitions inside view itself
 */
regions) {
    const offset = document.offsetAt(position);
    const goToSourceWord = (0, find_source_word_1.findSourceWord)(region, offset);
    // 1.
    const repeatForRegions = regions === null || regions === void 0 ? void 0 : regions.filter((_region) => _region.type === ViewRegions_1.ViewRegionType.RepeatFor);
    if (repeatForRegions == null)
        return;
    const targetRepeatForRegion = repeatForRegions.find((repeatForRegion) => { var _a; return ((_a = repeatForRegion.data) === null || _a === void 0 ? void 0 : _a.iterator) === goToSourceWord; });
    if (targetRepeatForRegion) {
        /** repeat.for="" */
        if (targetRepeatForRegion.sourceCodeLocation.startLine === undefined ||
            targetRepeatForRegion.sourceCodeLocation.startOffset === undefined ||
            targetRepeatForRegion.sourceCodeLocation.startCol === undefined) {
            console.error(`RepeatFor-Region does not have a start (line). cSearched for ${goToSourceWord}`);
            return;
        }
        return {
            lineAndCharacter: {
                line: targetRepeatForRegion.sourceCodeLocation.startLine,
                character: targetRepeatForRegion.sourceCodeLocation.startCol,
            } /** TODO: Find class declaration position. Currently default to top of file */,
            viewModelFilePath: uri_utils_1.UriUtils.toSysPath(document.uri),
        };
    }
    // 2.
    const viewModelDefinition = getAccessScopeViewModelDefinition(document, position, region, aureliaProgram);
    return viewModelDefinition;
}
exports.getAccessScopeDefinition = getAccessScopeDefinition;
/*
 * 2. To related view model
 *  Below all have same logic:
 *  2.1 inter-bindable.bind=">increaseCounter()<"
 *  2.2 <div css="width: ${>message<}px;"></div>
 *  2.3 ${grammarRules.length}
 */
function getAccessScopeViewModelDefinition(document, position, region, aureliaProgram) {
    var _a;
    const offset = document.offsetAt(position);
    const goToSourceWord = (0, find_source_word_1.findSourceWord)(region, offset);
    const targetComponent = aureliaProgram.aureliaComponents.getOneBy('viewFilePath', uri_utils_1.UriUtils.toSysPath(document.uri));
    const targetMember = (_a = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.classMembers) === null || _a === void 0 ? void 0 : _a.find((member) => member.name === goToSourceWord);
    if (!targetMember)
        return;
    const viewModelPath = (0, related_1.getRelatedFilePath)(uri_utils_1.UriUtils.toSysPath(document.uri), [
        '.js',
        '.ts',
    ]);
    const viewModelDocument = TextDocumentUtils_1.TextDocumentUtils.createFromPath(viewModelPath, 'typescript');
    const targetPosition = viewModelDocument.positionAt(targetMember.start);
    const defintion = {
        lineAndCharacter: {
            line: targetPosition.line + 1,
            character: targetPosition.character,
        },
        viewModelFilePath: viewModelPath,
    };
    return defintion;
}
exports.getAccessScopeViewModelDefinition = getAccessScopeViewModelDefinition;
//# sourceMappingURL=accessScopeDefinition.js.map