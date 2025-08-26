#!/usr/bin/env node

import './testEnv.ts';
import { printTestSummary, run } from './tools.ts';

/* Run all tests */
import './appTools.spec.ts';
import './parser.spec.ts';

run();
printTestSummary();
