/** JSON.parse that accepts a leading UTF-8 BOM, which Windows editors and PowerShell write and JSON.parse rejects. */
export const parseJson = (text) => JSON.parse(String(text).replace(/^﻿/, ""));
