// Runs before every test file (Create React App convention)
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// jsdom in CRA's Jest lacks these; React Router 7 needs them
Object.assign(global, { TextEncoder, TextDecoder });

// Several tests render the whole app (sidebar, 70+ lessons); on a busy machine running suites
// in parallel they can take longer than Jest's default 5 seconds
jest.setTimeout(20000);
