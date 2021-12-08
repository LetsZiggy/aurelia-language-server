/* eslint-disable no-template-curly-in-string */
import { TextDocument } from 'vscode-languageserver-textdocument';

import { AureliaView } from '../../../server/src/common/constants';
import { ViewRegionUtils } from '../../../server/src/common/documens/ViewRegionUtils';
import { RegionParser } from '../../../server/src/core/regions/RegionParser';
import {
  RepeatForRegion,
  ViewRegionSubType,
  ViewRegionType,
} from '../../../server/src/core/regions/ViewRegions';
import {
  TestCasesMapFileBased,
  getEmptyShared,
  filterTestCaseMap,
  givenImInTheProject,
  whenIParseTheFile,
  andImOnTheLine,
  COLLECTION_SPLIT,
  GROUP_SPLIT,
} from '../common/testTemplate';

const testCasesMapFileBased: TestCasesMapFileBased = {};

/* prettier-ignore */
testCasesMapFileBased['Offsets'] = [
  //   , CODE                                          , PARAMETERS                        , Type                      , LINE  , FILE
  [{}  , '<div id.bind="bar"></div>'                   , {regVal:'bar' ,off:'45;48'}       , 'Attribute'               , 2     , 'custom-element.html' ] ,
  [{}  , '<div id="${foo}"></div>'                     , {regVal:'foo' ,off:'18;21'}       , 'AttributeInterpolation'  , 1     , 'custom-element.html' ] ,
  [{}  , ''                                            , {}                                , 'CustomElement'           , NaN   , 'other-custom-element-user.html' ] ,
  [{}  , ''                                            , {}                                , 'Import'                  , NaN   , 'other-custom-element-user.html' ] ,
  [{}  , '<div repeat.for="fooElement of foo"></div>'  , {regVal:'foo' ,off:'88;91'}       , 'RepeatFor'               , 3     , 'custom-element.html' ] ,
  [{}  , '${foo}'                                      , {regVal:'foo' ,off:'2;6' }        , 'TextInterpolation'       , 0     , 'custom-element.html' ] ,
];

/* prettier-ignore */
testCasesMapFileBased['Access scopes'] = [
   //     , CODE                                                        , PARAMETERS                                                                         , Type                      , LINE  , FILE

   [{}    , '<p id.bind="foo"></p>'                                     , {accSco:['foo'] ,nameLoc:['12;15'] }                                               , 'Attribute'               , NaN   , '' ] ,
   [{}    , '<p>${foo}</p>'                                             , {accSco:['foo'] ,nameLoc: ['5;8']}                                                 , 'Attribute'               , NaN   , ''] ,
   [{}    , '<p>\n..${foo}</p>'                                         , {accSco:['foo'] ,nameLoc: ['8;11']}                                                , 'Attribute'               , NaN   , ''] ,
   [{}    , '<p>\r\n..${foo}</p>'                                       , {accSco:['foo'] ,nameLoc: ['9;12']}                                                , 'Attribute'               , NaN   , ''] ,
   [{}    , '<p>\n\n..${foo}</p>'                                       , {accSco:['foo'] ,nameLoc: ['9;12']}                                                , 'Attribute'               , NaN   , ''] ,
   [{}    , '<p>\n\n..${foo} ${bar}</p>'                                , {accSco:['foo!bar'] ,nameLoc: ['9;12!16;19']}                                      , 'Attribute'               , NaN   , ''] ,
   [{}    , '<p>\n..${foo}\n..${bar}</p>'                               , {accSco:['foo!bar'] ,nameLoc: ['8;11!17;20']}                                      , 'Attribute'               , NaN   , ''] ,
   [{}    , '<p>\n\n..${foo} ${bar}\n..${qux}</p>'                      , {accSco:['foo!bar!qux'] ,nameLoc: ['9;12!16;19!25;28']}                            , 'Attribute'               , NaN   , ''] ,
   [{}    , '<p>\r\n\r\n..${foo} ${bar}\r\n..${qux}</p>'                , {accSco:['foo!bar!qux'] ,nameLoc: ['11;14!18;21!28;31']}                           , 'Attribute'               , NaN   , ''] ,
   [{}    , '<p repeat.for="person of people"></p>'                     , {accSco:['people']}                                                                , 'Attribute'               , NaN   , ''] ,
   [{}    , '<p repeat.for="p of people | foo:bar & qux:\'zed\'"></p>'  , {accSco:['people;bar']}                                                            , 'Attribute'               , NaN   , ''] ,

   // //  , Html-only Custom Elements
   [{}    , "<template bindable='foo'></template>"      , {accSco:['foo'] ,nameLoc:['20;23'] }                            , 'Attribute'               , NaN   , '' ] ,

   // //  , Nested
   [{}    , "<p>a ${zzz} mid ${foo ? `(${foo.bar})` : ''} Max</p>"      , {accSco:['zzz!foo!foo'] ,nameLoc:['7;10!18;21!28;31'] }                            , 'Attribute'               , NaN   , '' ] ,
   [{}    , "<p>foo ${bar}</p>"                                         , {accSco:['bar'] ,nameLoc:['9;12'] }                                                , 'Attribute'               , NaN   , '' ] ,

   // //  , File based
   // //  , CODE                                                        , PARAMETERS                                                                         , Type                      , LINE  , FILE
   [{}    , '<div id="${foo}"></div>'                                   , {accSco:['foo'] ,nameLoc: ['18;21']}                                               , 'AttributeInterpolation'  , 1     , 'custom-element.html'],
   [{}    , '<div id.bind="bar"></div>'                                 , {accSco:['bar'] ,nameLoc: ['45;48']}                                               , 'Attribute'               , 2     , 'custom-element.html'],
   [{}    , '<span id.bind="qux.attr">${qux.interpol}</span>'           , {accSco:['qux','qux'] ,nameLoc: ['115;118','127;130']}                             , 'Many'                    , 4     , 'custom-element.html'],
   [{}    , '<p class="${useFoo(qux)}">${arr[qux] |hello}</p>'          , {accSco:['useFoo!qux','arr!qux'] ,nameLoc: ['160;166!167;170','176;179!180;183']}  , 'Many'                    , 5     , 'custom-element.html'],
];

/* prettier-ignore */
testCasesMapFileBased['No parse result'] = [
  //  , CODE               , PARAMETERS   , Type    , LINE  , FILE
  [{} , '<a href=""></a>'  , {}           , 'ATag'  , 0     , '' ] ,
];

describe('RegionParser.', () => {
  let shared = getEmptyShared();
  const filteredTestCaseMap = filterTestCaseMap(testCasesMapFileBased);

  Object.entries(filteredTestCaseMap).forEach(([testName, testCases]) => {
    testCases.forEach((testCase) => {
      const [, code, parameters, regionType, line, fileName] = testCase;

      // Actual suite
      describe(`${testName}.`, () => {
        describe(`${regionType}.`, () => {
          beforeEach(() => {
            if (fileName === '') return;

            givenImInTheProject('scoped-for-testing', shared);

            whenIParseTheFile(fileName, shared);

            andImOnTheLine(line, shared);
          });
          afterEach(() => {
            shared = getEmptyShared();
          });

          // -- Region types

          // Custom Element
          if (regionType === ViewRegionType.CustomElement) {
            // Custom Element - BindableAttribute
            it('the result should include Custom element bindable attributes', () => {
              const target = ViewRegionUtils.getRegionsOfType(
                shared.parsedRegions,
                ViewRegionType.CustomElement
              );
              expect(target.length).toBeGreaterThan(0);
              const result = target[0].data?.find(
                (attribute) =>
                  attribute.type === ViewRegionType.BindableAttribute
              );
              result /* ? */
              expect(result?.regionValue).toBe('foo');
            });

            // Custom Element - Whole Tag
            it('the result should include Custom element - whole tag', () => {
              // shared.parsedRegions /* ? */
              const target = ViewRegionUtils.getRegionsOfType(
                shared.parsedRegions,
                ViewRegionType.CustomElement
              );
              const openingCustomElementTag = target[0];
              openingCustomElementTag; /*?*/

              const { startTagLocation } = openingCustomElementTag;
              expect(startTagLocation.startLine).toBe(5);
              expect(startTagLocation.startCol).toBe(2);
              expect(startTagLocation.startOffset).toBe(142);
              expect(startTagLocation.endLine).toBe(10);
              expect(startTagLocation.endCol).toBe(3);
              expect(startTagLocation.endOffset).toBe(238);
            });

            // Custom Element - Start Tag
            it('the result should include Custom element - opening tag', () => {
              const target = ViewRegionUtils.getRegionsOfType(
                shared.parsedRegions,
                ViewRegionType.CustomElement
              );
              const openingCustomElementTag = target[0];
              expect(openingCustomElementTag.subType).toBe(
                ViewRegionSubType.StartTag
              );

              const { sourceCodeLocation } = openingCustomElementTag;
              expect(sourceCodeLocation.startLine).toBe(5);
              expect(sourceCodeLocation.startCol).toBe(3);
              expect(sourceCodeLocation.startOffset).toBe(143);
              expect(sourceCodeLocation.endLine).toBe(5);
              expect(sourceCodeLocation.endCol).toBe(17);
              expect(sourceCodeLocation.endOffset).toBe(157);
            });

            // Custom Element - End Tag
            it('the result should include Custom element - closing tag', () => {
              const target = ViewRegionUtils.getRegionsOfType(
                shared.parsedRegions,
                ViewRegionType.CustomElement
              );
              expect(target.length).toBe(2);
              const closingCustomElementTag = target[1];
              expect(closingCustomElementTag.subType).toBe(
                ViewRegionSubType.EndTag
              );

              const { sourceCodeLocation } = closingCustomElementTag;
              expect(sourceCodeLocation.startCol).toBe(5);
              expect(sourceCodeLocation.startLine).toBe(10);
              expect(sourceCodeLocation.startOffset).toBe(240);
              expect(sourceCodeLocation.endCol).toBe(19);
              expect(sourceCodeLocation.endLine).toBe(10);
              expect(sourceCodeLocation.endOffset).toBe(254);
            });
          }

          // Import
          else if (regionType === ViewRegionType.Import) {
            it('the result should include import tags.', () => {
              const target = ViewRegionUtils.getRegionsOfType(
                shared.parsedRegions,
                ViewRegionType[regionType]
              );

              expect(target.length).toBeGreaterThan(0);
              expect(target[0].attributeName).toBe(
                AureliaView.IMPORT_FROM_ATTRIBUTE
              );
            });
          }

          // -- Parameters

          // Offset
          if (parameters.off != null) {
            // TODO: Do we need raw sourceCodeLocation at all? Now that we hav accessScopes?
            it.skip('Should have the correct offset for the region.', () => {
              const target = ViewRegionUtils.getTargetRegionByLine(
                shared.parsedRegions,
                String(shared.line)
              );
              target; /* ? */

              expect(target).toBeDefined();
              if (!target) return;
              if (parameters.off == null) return;

              const [startOffset, endOffset] =
                parameters.off.split(GROUP_SPLIT);

              if (RepeatForRegion.is(target)) {
                const repeatForRegion = target;
                expect(repeatForRegion.data?.iterableStartOffset).toBe(
                  Number(startOffset)
                );
                expect(repeatForRegion.data?.iterableEndOffset).toBe(
                  Number(endOffset)
                );
              } else {
                expect(target.sourceCodeLocation.startOffset).toBe(
                  Number(startOffset)
                );
                expect(target.sourceCodeLocation.endOffset).toBe(
                  Number(endOffset)
                );
              }
            });
          }

          if (parameters.accSco != null && parameters.nameLoc != null) {
            it(code, () => {
              if (parameters.accSco == null) return;
              if (parameters.nameLoc == null) return;

              let targetRegions = shared.parsedRegions;
              if (shared.parsedRegions.length === 0) {
                const document = TextDocument.create('', 'html', 0, code);
                targetRegions = RegionParser.parse(document, []);
              }
              // targetRegions /* ? */

              if (!isNaN(shared.line)) {
                targetRegions = ViewRegionUtils.getManyTargetsRegionByLine(
                  targetRegions,
                  String(shared.line)
                );
              }

              const rawExpectedAccessScopes = parameters.accSco;
              const rawExpectedNameLocation = parameters.nameLoc;

              // expect(true).toBeFalsy();
              targetRegions.forEach((region, regionIndex) => {
                const resultNames = region.accessScopes?.map(
                  (scope) => scope.name
                );
                if (!resultNames) return;
                if (rawExpectedAccessScopes == null) return;
                const expectedAccessScopes =
                  rawExpectedAccessScopes[regionIndex].split(COLLECTION_SPLIT);
                expectedAccessScopes; /* ? */

                expect(resultNames).toEqual(expectedAccessScopes);

                if (rawExpectedNameLocation == null) return;
                if (rawExpectedNameLocation.length === 0) return;

                region.accessScopes?.forEach((scope, scopeIndex) => {
                  const expectedNameLocation =
                    rawExpectedNameLocation[regionIndex].split(
                      COLLECTION_SPLIT
                    );
                  const [expectedStart, expectedEnd] =
                    expectedNameLocation[scopeIndex].split(GROUP_SPLIT);
                  const { start, end } = scope.nameLocation;

                  expect(start).toEqual(Number(expectedStart));
                  expect(end).toEqual(Number(expectedEnd));
                });
              });
            });
          }

          // No parse result
          if (testName === 'No parse result') {
            it(testName, () => {
              const document = TextDocument.create('', '', 0, code);
              const parsedRegions = RegionParser.parse(document, []);
              expect(parsedRegions.length).toBe(0);
            });
          }
        });
      });
    });
  });
});
