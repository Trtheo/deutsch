// Runs before every test file (Create React App convention)
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// jsdom in CRA's Jest lacks these; React Router 7 needs them
Object.assign(global, { TextEncoder, TextDecoder });
