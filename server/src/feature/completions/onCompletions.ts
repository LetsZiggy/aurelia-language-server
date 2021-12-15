import { getLanguageService } from 'vscode-html-languageservice';
import {
  CompletionItem,
  CompletionParams,
  CompletionTriggerKind,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { TemplateAttributeTriggers } from '../../common/constants';
import { ViewRegionUtils } from '../../common/documens/ViewRegionUtils';
import { checkInsideTag, ParseHtml } from '../../common/view/document-parsing';
import { AureliaProjects } from '../../core/AureliaProjects';
import { Container } from '../../core/container';
import { AbstractRegionLanguageService } from '../../core/regions/languageServer/AbstractRegionLanguageService';
import { AureliaHtmlLanguageService } from '../../core/regions/languageServer/AureliaHtmlLanguageService';
import { RegionParser } from '../../core/regions/RegionParser';
import {
  AbstractRegion,
  BindableAttributeRegion,
  CustomElementRegion,
} from '../../core/regions/ViewRegions';
import {
  createAureliaTemplateAttributeKeywordCompletions,
  createAureliaTemplateAttributeCompletions,
} from './createAureliaTemplateAttributeCompletions';

export async function onCompletion(
  container: Container,
  completionParams: CompletionParams,
  document: TextDocument
) {
  const { position } = completionParams;
  const offset = document.offsetAt(position);
  const text = document.getText();

  // Stop if inside comment
  const isInsideComment = ParseHtml.findCommentAtOffset(text, offset);
  if (isInsideComment != null) return [];

  const aureliaProjects = container.get(AureliaProjects);
  const targetProject = aureliaProjects.getFromUri(document.uri);
  if (!targetProject) return [];
  const aureliaProgram = targetProject?.aureliaProgram;
  if (!aureliaProgram) return [];

  const triggerCharacter =
    completionParams.context?.triggerCharacter ??
    text.substring(offset - 1, offset);

  // Check if we are inside a region
  // Because, then we have to ignore the triggerCharacter.
  // We ignore, to allow the parser to have a valid state.
  // At least we want to maximize the chance, that given state is valid (for the parser).
  const targetComponent =
    aureliaProgram.aureliaComponents.getOneByFromDocument(document);
  const existingRegions = targetComponent?.viewRegions ?? [];
  const existingRegion = ViewRegionUtils.findRegionAtOffset(
    existingRegions,
    offset
  );

  let regions: AbstractRegion[] = [];
  let isInsertTriggerCharacter = false;
  const wasInvoked =
    completionParams.context?.triggerKind === CompletionTriggerKind.Invoked;
  const shouldInsertTriggerCharacter = existingRegion != null && !wasInvoked;
  if (shouldInsertTriggerCharacter) {
    // replace trigger character
    regions = existingRegions;
    isInsertTriggerCharacter = true;
  } else {
    // re parse
    const allComponents = aureliaProgram.aureliaComponents.getAll();
    try {
      regions = RegionParser.parse(document, allComponents);
    } catch (error) {
      /* prettier-ignore */ console.log('TCL: error', error);
      /* prettier-ignore */ console.log('TCL: (error as Error).stack', (error as Error).stack);
    }
  }

  const region = ViewRegionUtils.findRegionAtOffset(regions, offset);

  // offset; /*?*/
  // regions; /* ? */

  let accumulateCompletions: CompletionItem[] = [];

  const isAcceptableRegion =
    region === undefined || CustomElementRegion.is(region);
  if (triggerCharacter === TemplateAttributeTriggers.DOT) {
    const isInsideTag = await checkInsideTag(document, offset);

    const allowKeywordCompletion =
      (isAcceptableRegion || BindableAttributeRegion.is(region)) && isInsideTag;
    if (allowKeywordCompletion) {
      const nextChar = text.substring(offset, offset + 1);
      const atakCompletions =
        createAureliaTemplateAttributeKeywordCompletions(nextChar);
      return atakCompletions;
    }
  }

  const isNotRegion = region === undefined;
  const isInsideTag = await checkInsideTag(document, offset);

  // Attribute completions
  if (isInsideTag) {
    const ataCompletions = createAureliaTemplateAttributeCompletions();
    const htmlLanguageService = getLanguageService();
    const htmlDocument = htmlLanguageService.parseHTMLDocument(document);
    const htmlLSResult = htmlLanguageService.doComplete(
      document,
      position,
      htmlDocument
    );
    const isInsideAttributeValue = ParseHtml.findAttributeValueAtOffset(
      document.getText(),
      offset
    );

    const completionsWithStandardHtml = [...htmlLSResult.items];

    // Inside eg. attr=">here<", then don't push Aurelia completions
    if (!isInsideAttributeValue) {
      completionsWithStandardHtml.push(...ataCompletions);
    }

    // Early return to get some HTML completions + generic Aurelia completions
    if (isNotRegion) {
      return completionsWithStandardHtml;
    }

    // HTML + Generic Aurelia completions for eg. Custom Element and Bindable Attributes
    if (isAcceptableRegion) {
      accumulateCompletions = completionsWithStandardHtml;
    }
  }

  // Completions, that need Language service
  let languageService: AbstractRegionLanguageService;
  if (region === undefined) {
    languageService = new AureliaHtmlLanguageService();
  } else {
    languageService = region.languageService;
  }

  const doComplete = languageService.doComplete;
  if (doComplete === undefined) return [];

  let completions: CompletionItem[] = [CompletionItem.create('')];
  try {
    completions = (await doComplete(
      aureliaProgram,
      document,
      triggerCharacter,
      region,
      offset,
      isInsertTriggerCharacter
    )) as unknown as CompletionItem[];
    // completions /* ? */
  } catch (error) {
    console.log('TCL: error', error);
    /* prettier-ignore */ console.log('TCL: (error as Error).stack', (error as Error).stack);
  }

  accumulateCompletions.push(...completions);
  return accumulateCompletions;
}
