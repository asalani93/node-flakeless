const Flakeless = require('../build/Release/flakeless').Flakeless;

/**
 * Represents an ID generator.
 * @alias Flakeless
 * @constructor
 * @param {object} [opts] - Configuration for ID generation.
 * @param {string} [opts.outputType='base64'] - Either 'base10', 'base16', or
 *   'base64'.  Determines which format and alphabet to output the IDs in.
 * @param {number} [opts.workerID=0] - A unique ID representing this particular
 *   ID generator.
 * @param {number} [opts.epochStart=0] - The date to use as the start of the
 *   epoch that you are generating IDs over. Affords approximately 69 years of
 *   IDs after the provided date. Specified in milliseconds since the Unix
 *   epoch.
 */
module.exports = Flakeless;
