import { StepDefinitions } from 'jest-cucumber';
import { CompletionList } from 'vscode-html-languageservice';

import { Logger } from '../../../server/src/common/logging/logger';
import {
  AureliaCompletionItem,
  isAureliaCompletionItem,
} from '../../../server/src/feature/completions/virtualCompletion';
import { createTextDocumentPositionParams } from '../../../server/src/feature/embeddedLanguages/languageModes';
import { myMockServer } from '../initialization/on-initialized/detecting-on-init.spec';
import { position, languageModes } from './common/common-capabilities.spec';

const logger = new Logger('[Test] Completions');

export let completions: AureliaCompletionItem[] | CompletionList = [];

export const completionSteps: StepDefinitions = ({ when, then }) => {
  when('I trigger Suggestions', async () => {
    /* prettier-ignore */ logger.log('I trigger Suggestions',{logPerf:true});

    const document = myMockServer.textDocuments.getFirst();
    const textDocumentPositionParams = createTextDocumentPositionParams(
      document,
      position
    );

    if (!isAureliaCompletionItem(completions)) {
      throw new Error('Not AureliaCompletionItem[]');
    }

    completions = await myMockServer
      .getAureliaServer()
      .onCompletion(textDocumentPositionParams, document, languageModes);
  });

  then('I should get the correct suggestions', () => {
    /* prettier-ignore */ logger.log('I should get the correct suggestion',{logPerf:true});

    if (isAureliaCompletionItem(completions)) {
      expect(completions.length).toBeGreaterThan(0);
    }

    // expect(true).toBeFalsy();
  });

  then(
    /^I should get the correct method (.*) with brackets$/,
    (methodName: string) => {
      if (isAureliaCompletionItem(completions)) {
        const target = completions.find(
          (completion) => completion.label === methodName
        );

        expect(target?.insertText).toEqual('functionVariable()');
      }
    }
  );

  then(
    /^I should get the correct method (.*) with its arguments$/,
    (methodName: string) => {
      if (isAureliaCompletionItem(completions)) {
        const target = completions.find(
          (completion) => completion.label === methodName
        );

        expect(target?.insertText).toEqual(
          'methodWithArgs(${1:first}, ${2:second})'
        );
      }
    }
  );
};
