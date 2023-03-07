"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegionService = void 0;
const ViewRegions_1 = require("../../aot/parser/regions/ViewRegions");
const OffsetUtils_1 = require("../documens/OffsetUtils");
const PositionUtils_1 = require("../documens/PositionUtils");
const AnalyzerService_1 = require("./AnalyzerService");
class RegionService {
    static getRegionsOfType(regions, regionType) {
        const targetRegions = regions.filter((region) => region.type === regionType);
        return targetRegions;
    }
    static getManyRegionsInRange(regions, document, range) {
        const rangeStartOffset = document.offsetAt(range.start);
        const rangeEndOffset = document.offsetAt(range.end);
        const result = regions.filter((region) => {
            const startIncluded = OffsetUtils_1.OffsetUtils.isIncluded(rangeStartOffset, rangeEndOffset, region.sourceCodeLocation.startOffset);
            const endIncluded = OffsetUtils_1.OffsetUtils.isIncluded(rangeStartOffset, rangeEndOffset, region.sourceCodeLocation.endOffset);
            const included = startIncluded && endIncluded;
            return included;
        });
        return result;
    }
    static getTargetRegionByLine(regions, line) {
        const result = regions.find((region) => {
            return region.sourceCodeLocation.startLine === Number(line);
        });
        return result;
    }
    static getManyTargetsRegionByLine(regions, line) {
        const result = regions.filter((region) => {
            var _a;
            const isSameLine = region.sourceCodeLocation.startLine === Number(line);
            if (isSameLine) {
                // Excluded TextInterpolation regions, because text regions start on "line before" in parse5
                if (((_a = region.textValue) === null || _a === void 0 ? void 0 : _a.startsWith('\n')) === true) {
                    return false;
                }
            }
            return isSameLine;
        });
        return result;
    }
    static findRegionAtPosition(regions, position) {
        // RegionParser.pretty(regions, {
        //   asTable: true,
        //   ignoreKeys: [
        //     'sourceCodeLocation',
        //     'languageService',
        //     'subType',
        //     'tagName',
        //   ],
        //   maxColWidth: 12,
        // }); /*?*/
        let targetRegion;
        regions.find((region) => {
            let possibleRegion = region;
            if (ViewRegions_1.CustomElementRegion.is(region)) {
                const subTarget = this.findRegionAtPosition(region.data, position);
                if (subTarget) {
                    possibleRegion = subTarget;
                }
            }
            const start = possibleRegion.getStartPosition();
            const end = possibleRegion.getEndPosition();
            const isIncluded = PositionUtils_1.PositionUtils.isIncluded(start, end, position);
            if (isIncluded) {
                targetRegion = possibleRegion;
            }
            return isIncluded;
        });
        if (!targetRegion)
            return;
        return targetRegion;
    }
    static findRegionAtOffset(regions, offset) {
        const possibleRegions = [];
        regions.forEach((region) => {
            const possibleRegion = region;
            // CustomElementRegion
            if (ViewRegions_1.CustomElementRegion.is(region)) {
                const subTarget = this.findRegionAtOffset(region.data, offset);
                if (subTarget !== undefined) {
                    possibleRegions.push(subTarget);
                }
                if (possibleRegion.startTagLocation) {
                    const { startOffset, endOffset } = possibleRegion.startTagLocation;
                    const isIncluded = OffsetUtils_1.OffsetUtils.isIncluded(startOffset, endOffset, offset);
                    if (isIncluded) {
                        possibleRegions.push(region);
                    }
                }
            }
            const { startOffset, endOffset } = possibleRegion.sourceCodeLocation;
            const isIncluded = OffsetUtils_1.OffsetUtils.isIncluded(startOffset, endOffset, offset);
            if (isIncluded) {
                possibleRegions.push(region);
            }
        });
        const targetRegion = findSmallestRegionAtOffset(possibleRegions, offset);
        // if (targetRegion === undefined) {
        //   targetRegion = AureliaHtmlRegion.create();
        // }
        return targetRegion;
    }
    static isInCustomElementStartTag(region, offset) {
        if (!ViewRegions_1.CustomElementRegion.is(region))
            return false;
        const { startOffset, endOffset } = region.sourceCodeLocation;
        const afterStart = startOffset <= offset;
        const beforeEnd = offset <= endOffset;
        const is = afterStart && beforeEnd;
        return is;
    }
    static getRegionsInDocument(container, document) {
        const targetComponent = AnalyzerService_1.AnalyzerService.getComponentByDocumennt(container, document);
        if (!targetComponent)
            return [];
        const regions = targetComponent.viewRegions;
        return regions;
    }
    static getRegionsOfTypeInDocument(container, document, options) {
        const regions = this.getRegionsInDocument(container, document);
        let regionsOfType = this.getRegionsOfType(regions, options.regionType);
        if (options.subRegionType) {
            regionsOfType = regionsOfType.filter((customElement) => customElement.subType === options.subRegionType);
        }
        return regionsOfType;
    }
}
exports.RegionService = RegionService;
/**
 * {} - parent
 * [] - child
 * Assumption: Child always fully included in parent.
 *
 * {[        |     ]}
 * {     [   |     ]}
 * {     [   |  ]   }
 * {[        |   ]  }
 */
function findSmallestRegionAtOffset(regions, offset) {
    /** Determine how small a region is. */
    let smallestValue = Infinity;
    let smallestRegionIndex = 0;
    regions.forEach((region, index) => {
        if (region.sourceCodeLocation === undefined)
            return;
        const { startOffset, endOffset } = region.sourceCodeLocation;
        if (startOffset > offset)
            return;
        if (offset > endOffset)
            return;
        const startDelta = offset - startOffset;
        const endDelta = endOffset - offset;
        const deltaLength = endDelta + startDelta;
        if (smallestValue > deltaLength) {
            smallestValue = deltaLength;
            smallestRegionIndex = index;
        }
    });
    const result = regions[smallestRegionIndex];
    return result;
}
//# sourceMappingURL=RegionService.js.map