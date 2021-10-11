import 'reflect-metadata';
import * as Path from 'path';

import { Project, ts } from 'ts-morph';

import { getAureliaComponentInfoFromClassDeclaration } from './getAureliaComponentList';
import { Logger } from '../../common/logging/logger';
import {
  IProjectOptions,
  defaultProjectOptions,
} from '../../common/common.types';
import { AureliaClassTypes } from '../../common/constants';
import { ViewRegionInfo } from '../embeddedLanguages/embeddedSupport';
import { AureliaComponents } from './aurelia-components';

const logger = new Logger('AureliaProgram');

export interface IAureliaClassMember {
  name: string;
  documentation: string;
  isBindable: boolean;
  syntaxKind: ts.SyntaxKind;
}

export interface IAureliaComponent {
  documentation: string;
  sourceFile?: ts.SourceFile;
  version?: number;
  /** export class >ComponentName< {} */
  className: string;
  /** component-name */
  baseViewModelFileName: string;
  /** path/to/component-name.ts */
  viewModelFilePath: string;
  /**
   * export class >Sort<ValueConverter {} --> sort
   * */
  valueConverterName?: string;
  /**
   * \@customElement(">component-name<")
   * export class >ComponentName< {} --> component-name
   * */
  componentName?: string;
  viewFilePath?: string;
  type: AureliaClassTypes;
  /** ******** Class Members */
  classMembers?: IAureliaClassMember[];
  /** ******** View */
  viewRegions?: ViewRegionInfo[];
}

export interface IAureliaBindable {
  componentName: string;
  /**
   * Class member information of bindable.
   *
   * Reason for structure:
   * Before, the interface was like `export interface IAureliaBindable extends IAureliaClassMember`,
   * but due to further processing hardship (creating actual CompletionItem), that interface was hard to work with.
   */
  classMember: IAureliaClassMember;
}

/**
 * The AureliaProgram class represents your whole applicaton
 * (aka. program in typescript terminology)
 */
export class AureliaProgram {
  public builderProgram: ts.Program;
  public aureliaSourceFiles?: ts.SourceFile[] | undefined;
  public projectFilePaths: string[] = [];
  public aureliaComponents: AureliaComponents;
  tsMorphProject: Project;

  constructor() {
    this.aureliaComponents = new AureliaComponents();
  }

  public getComponentList(): IAureliaComponent[] {
    return this.aureliaComponents.get();
  }

  public initAureliaComponents(projectOptions: IProjectOptions): void {
    const program = this.getProgram();
    this.determineProjectFilePaths(projectOptions);
    const filePaths = this.getProjectFilePaths();

    this.aureliaComponents.init(program, filePaths);
  }

  public getProjectFilePaths(): string[] {
    return this.projectFilePaths;
  }

  public determineProjectFilePaths(projectOptions: IProjectOptions): void {
    if (projectOptions.rootDirectory) {
      this.projectFilePaths = this.getCustomProjectsFilePaths(projectOptions);
      return;
    }

    const sourceFiles = this.getAureliaSourceFiles();
    if (!sourceFiles) return;
    const filePaths = sourceFiles.map((file) => file.fileName);
    if (!filePaths) return;
    this.projectFilePaths = filePaths;
  }

  public getCustomProjectsFilePaths(
    options: IProjectOptions = defaultProjectOptions
  ): string[] {
    const { rootDirectory, exclude, include } = options;
    const targetSourceDirectory = rootDirectory || ts.sys.getCurrentDirectory();
    const finalExcludes = getFinalExcludes(exclude);
    const finalIncludes = getFinalIncludes(include);
    const paths = ts.sys.readDirectory(
      targetSourceDirectory,
      ['ts'],
      // ['ts', 'js', 'html'],
      finalExcludes,
      finalIncludes
    );

    return paths;
  }

  /**
   * getProgram gets the current program
   *
   * The program may be undefined if no watcher is present or no program has been initiated yet.
   *
   * This program can change from each call as the program is fetched
   * from the watcher which will listen to IO changes in the tsconfig.
   */
  public getProgram(): ts.Program {
    if (!this.builderProgram) {
      throw new Error('No Program');
    }
    return this.builderProgram;
  }

  public setBuilderProgram(builderProgram: ts.Program): void {
    this.builderProgram = builderProgram;
    this.initAureliaSourceFiles(this.builderProgram);
  }

  public getTsMorphProject() {
    return this.tsMorphProject;
  }
  public setTsMorphProject(tsMorphProject: Project) {
    this.tsMorphProject = tsMorphProject;
  }

  /**
   * Only update aurelia source files with relevant source files
   */
  public initAureliaSourceFiles(builderProgram: ts.Program): void {
    // [PERF]: ~0.6s
    const sourceFiles = builderProgram.getSourceFiles();
    this.aureliaSourceFiles = sourceFiles?.filter((sourceFile) => {
      const isNodeModules = sourceFile.fileName.includes('node_modules');
      return !isNodeModules;
    });
  }

  /**
   * Get aurelia source files
   */
  public getAureliaSourceFiles(): ts.SourceFile[] | undefined {
    if (this.aureliaSourceFiles) return this.aureliaSourceFiles;

    this.initAureliaSourceFiles(this.builderProgram);
    return this.aureliaSourceFiles;
  }
}

function getFinalIncludes(include: string[] | undefined) {
  let finalIncludes: string[];

  if (include !== undefined) {
    finalIncludes = include;
  } else {
    finalIncludes = ['src'];
  }
  return finalIncludes;
}

function getFinalExcludes(exclude: string[] | undefined) {
  const finalExcludes: string[] = [];

  if (exclude === undefined) {
    const defaultExcludes = [
      '**/node_modules',
      'aurelia_project',
      '**/out',
      '**/build',
      '**/dist',
    ];
    finalExcludes.push(...defaultExcludes);
  }
  return finalExcludes;
}
