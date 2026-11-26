/**
 * Reads a request body with a size limit (the bridge listens on loopback, but a page the developer has open can
 * still post to it, so no route reads an unbounded body).
 */
export const MAX_BODY_BYTES = Object.freeze({ audit: 2_000_000, findings: 256_000, small: 16_000 });

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {number} maxBytes
 * @returns {Promise<string>} the body text; rejects with an error whose `status` is 413 when it is too large
 */
export function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers?.["content-length"]);
    if (Number.isFinite(declared) && declared > maxBytes) {
      reject(Object.assign(new Error("payload too large"), { status: 413 }));
      req.resume?.();
      return;
    }
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error("payload too large"), { status: 413 }));
        req.destroy?.();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
